import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, MISSIONS, REWARDS, STORAGE_KEY } from '../dist/store.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
}
const orderInput = { itemId: 'eletricista', title: 'Pequenos reparos', price: 89.90, category: 'Serviços', provider: 'Ana' };

test('starts with illustrative coins and persists exact ledger through reload', () => {
  const storage = memoryStorage();
  const first = createStore(storage);
  assert.equal(first.getState().coins.balance, 250);
  assert.equal(first.claimMission('welcome').ok, true);
  assert.equal(createStore(storage).getState().coins.balance, 300);
  assert.deepEqual(createStore(storage).getState().coins.ledger, first.getState().coins.ledger);
  assert.equal(createStore(storage).claimMission('welcome').ok, false);
});

test('rejects invalid numbers, overspending, and blank recipients without changing balance', () => {
  const store = createStore(null);
  for (const amount of [NaN, Infinity, -1, 0, 0.5, '1', Number.MAX_SAFE_INTEGER, 251]) {
    assert.equal(store.transferCoins({ recipient: 'Maria', amount }).ok, false, `${amount}`);
  }
  assert.equal(store.transferCoins({ recipient: '', amount: 10 }).ok, false);
  assert.equal(store.getState().coins.balance, 250);
  assert.equal(store.transferCoins({ recipient: 'Maria', amount: 250 }).ok, true);
  assert.equal(store.getState().coins.balance, 0);
  assert.equal(store.redeemReward(REWARDS[0].id).ok, false);
});

test('mission prerequisites and one-time claims stay valid after reload', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  for (const id of ['profile', 'order', 'community']) assert.equal(store.claimMission(id).ok, false);
  assert.equal(store.updateProfile({ name: 'Kevin' }).ok, true);
  assert.equal(store.claimMission('profile').ok, true);
  assert.equal(store.addPost({ text: 'Olá, vizinhança!' }).ok, true);
  assert.equal(store.claimMission('community').ok, true);
  for (const id of ['profile', 'community']) assert.equal(createStore(storage).claimMission(id).ok, false);
  assert.equal(store.getState().coins.balance, 250 + MISSIONS.find(m => m.id === 'profile').amount + MISSIONS.find(m => m.id === 'community').amount);
});

test('completing an order awards once, cancellation cannot duplicate award', () => {
  const store = createStore(null);
  const { order } = store.createOrder(orderInput);
  assert.equal(store.getState().orders[0].status, 'solicitado');
  assert.equal(store.advanceOrder(order.id).order.status, 'confirmado');
  assert.equal(store.advanceOrder(order.id).order.status, 'a_caminho');
  assert.equal(store.advanceOrder(order.id).order.status, 'concluido');
  assert.equal(store.getState().coins.balance, 275);
  assert.equal(store.advanceOrder(order.id).ok, false);
  assert.equal(store.cancelOrder(order.id).ok, false);
  assert.equal(store.getState().coins.balance, 275);
  assert.equal(store.claimMission('order').ok, true);
  const cancelled = store.createOrder(orderInput).order;
  assert.equal(store.cancelOrder(cancelled.id).ok, true);
  assert.equal(store.advanceOrder(cancelled.id).ok, false);
  assert.equal(store.getState().coins.balance, 350);
});

test('rewards generate distinct coupons and debit the ledger exactly', () => {
  const store = createStore(null);
  const first = store.redeemReward('delivery');
  const second = store.redeemReward('delivery');
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.code, second.code);
  assert.equal(store.getState().coins.balance, 50);
  assert.equal(store.redeemReward('delivery').ok, false);
  const state = store.getState();
  assert.equal(state.coins.ledger.reduce((sum, row) => sum + row.amount, 0), state.coins.balance);
});

test('duplicate transaction IDs and corrupted balances safely recover a clean demo', () => {
  for (const corrupt of [
    state => { state.coins.balance = 999; },
    state => { state.coins.ledger.push({ ...state.coins.ledger[0] }); state.coins.balance = 500; },
    state => { state.coins.balance = -1; },
    state => { state.orders = [{ id: 'bad' }]; },
    state => { state.coins.claimedMissions = ['welcome', 'welcome']; }
  ]) {
    const storage = memoryStorage();
    const state = createStore(storage).getState();
    corrupt(state);
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    const restored = createStore(storage);
    assert.equal(restored.getState().coins.balance, 250);
    assert.equal(restored.getState().coins.ledger.length, 1);
    assert.equal(restored.getPersistenceStatus().recovered, true);
  }
});

test('invalid JSON and unavailable persistence remain usable in memory', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, '{invalid');
  assert.equal(createStore(storage).getState().coins.balance, 250);
  const unavailable = createStore({ getItem() { throw new Error('disabled'); }, setItem() { throw new Error('disabled'); } });
  assert.equal(unavailable.claimMission('welcome').ok, true);
  assert.equal(unavailable.getState().coins.balance, 300);
  assert.equal(unavailable.getPersistenceStatus().available, false);
});

test('returned state is immutable externally and subscriptions unsubscribe', () => {
  const store = createStore(null);
  const snapshot = store.getState();
  snapshot.coins.balance = 999;
  snapshot.coins.ledger.push({ amount: 999 });
  assert.equal(store.getState().coins.balance, 250);
  let updates = 0;
  const stop = store.subscribe(() => { updates++; });
  store.toggleFavorite('one');
  stop();
  store.toggleFavorite('one');
  assert.equal(updates, 1);
  assert.deepEqual(store.getState().favorites, []);
});

test('messages, comments, and likes persist without real external delivery', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  const { order } = store.createOrder(orderInput);
  assert.equal(store.sendMessage(order.id, 'Qual o horário?').ok, true);
  assert.equal(store.getState().messages[order.id].length, 3);
  assert.match(store.getState().messages[order.id][2].text, /^Demonstração:/);
  const { post } = store.addPost({ text: 'Conheçam o nosso bairro!' });
  store.toggleLike(post.id);
  store.addComment(post.id, 'Muito bom!');
  assert.equal(createStore(storage).getState().posts[0].likes, 1);
  assert.equal(createStore(storage).getState().posts[0].comments[0].text, 'Muito bom!');
  store.toggleLike(post.id);
  assert.equal(store.getState().posts[0].likes, 0);
});

test('rejects invalid orders and location updates atomically', () => {
  const store = createStore(null);
  assert.equal(store.createOrder({ ...orderInput, price: NaN }).ok, false);
  assert.equal(store.createOrder({ ...orderInput, price: -10 }).ok, false);
  assert.equal(store.getState().orders.length, 0);
  const before = store.getState().location;
  assert.equal(store.setLocation({ city: 'Outra', lat: 91 }).ok, false);
  assert.deepEqual(store.getState().location, before);
  assert.equal(store.setLocation({ city: 'Curitiba', neighborhood: 'Centro', lat: -25.43, lng: -49.27, cep: '80010000' }).ok, true);
  assert.equal(store.getState().profile.city, 'Curitiba');
});

test('reset clears demo activity and returns coins to the starting balance', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.updateProfile({ name: 'Kevin' });
  store.createOrder(orderInput);
  store.claimMission('welcome');
  store.resetDemo();
  const restored = createStore(storage).getState();
  assert.equal(restored.profile.name, 'Visitante');
  assert.equal(restored.coins.balance, 250);
  assert.equal(restored.orders.length, 0);
  assert.deepEqual(restored.coins.claimedMissions, []);
});

test('donations debit once per action and reject unknown campaigns and overspending', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  assert.equal(store.donateCoins({ campaignId: 'unknown', amount: 25 }).ok, false);
  assert.equal(store.donateCoins({ campaignId: 'food', amount: 251 }).ok, false);
  assert.equal(store.donateCoins({ campaignId: 'food', amount: 0.5 }).ok, false);
  assert.equal(store.donateCoins({ campaignId: 'food', amount: 25 }).ok, true);
  assert.equal(store.donateCoins({ campaignId: 'care', amount: 50 }).ok, true);
  const restored = createStore(storage).getState();
  assert.equal(restored.coins.balance, 175);
  assert.equal(restored.donations.length, 2);
  assert.equal(restored.donations.filter(d => d.campaignId === 'food').reduce((total, d) => total + d.amount, 0), 25);
  assert.equal(restored.coins.ledger.reduce((total, t) => total + t.amount, 0), 175);
});

test('community post preserves help/offer/story and validates illustrative rewards', () => {
  const store = createStore(null);
  assert.equal(store.addPost({ text: 'Preciso de ajuda', kind: 'help', reward: NaN }).ok, false);
  const { post } = store.addPost({ text: 'Preciso de ajuda', kind: 'help', reward: 10 });
  assert.equal(post.kind, 'help');
  assert.equal(post.reward, 10);
  assert.equal(store.addPost({ text: 'Posso ajudar', kind: 'offer' }).post.reward, 0);
});
