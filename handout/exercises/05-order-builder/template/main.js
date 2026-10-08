// Order Builder · your code goes in this file.
//   11  render the order
//   12  one listener for all the buttons
//   13  events change state, state renders
//   14  save the order asynchronously

const title = document.querySelector('#title');
const items = document.querySelector('#items');
const total = document.querySelector('#total');
const save = document.querySelector('#save');
const saveStatus = document.querySelector('#saveStatus');

const order = {
  id: 1842,
  items: [
    { id: 'A1', name: 'Coffee beans', price: 12, qty: 2 },
    { id: 'B4', name: 'Milk', price: 3, qty: 1 },
    { id: 'C7', name: 'Filters', price: 5, qty: 3 },
  ],
};

function render(order) {
  // your code
}

render(order);
