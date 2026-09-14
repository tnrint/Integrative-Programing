/* ==========================================================================
   Shelfline storage layer
   All records live in localStorage under SHELF_KEY. Every page includes
   this file before its own page script.
   ========================================================================== */

const SHELF_KEY = 'shelfline_books_v1';

const GENRES = ['Fiction', 'Nonfiction', 'Sci-Fi', 'Mystery', 'Biography', 'Poetry'];
const STATUSES = ['Unread', 'Reading', 'Read'];

const SPINE_COLOR = {
  Fiction: '#a63d2e',
  Nonfiction: '#1f3327',
  'Sci-Fi': '#2f4b6b',
  Mystery: '#4a4438',
  Biography: '#a97c2f',
  Poetry: '#6b3f5c'
};

function seedIfEmpty(){
  const existing = localStorage.getItem(SHELF_KEY);
  if (existing !== null) return;
  const seed = [
    { id: 'bk-1001', title: 'The Salt Path', author: 'Raynor Winn', genre: 'Nonfiction', year: 2018, status: 'Read', notes: 'A walk along the coast after losing everything. Recommended by Mai.' },
    { id: 'bk-1002', title: 'Klara and the Sun', author: 'Kazuo Ishiguro', genre: 'Sci-Fi', year: 2021, status: 'Reading', notes: 'Slow start, picks up around part two.' },
    { id: 'bk-1003', title: 'In Cold Blood', author: 'Truman Capote', genre: 'Mystery', year: 1966, status: 'Read', notes: '' },
    { id: 'bk-1004', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', genre: 'Nonfiction', year: 2013, status: 'Unread', notes: 'Borrowed the physical copy, need to actually start it.' },
    { id: 'bk-1005', title: 'Persepolis', author: 'Marjane Satrapi', genre: 'Biography', year: 2000, status: 'Read', notes: 'Reread candidate.' },
    { id: 'bk-1006', title: 'Devotions', author: 'Mary Oliver', genre: 'Poetry', year: 2017, status: 'Reading', notes: '' }
  ];
  localStorage.setItem(SHELF_KEY, JSON.stringify(seed));
}

function getBooks(){
  seedIfEmpty();
  try{
    return JSON.parse(localStorage.getItem(SHELF_KEY)) || [];
  }catch(e){
    return [];
  }
}

function saveBooks(books){
  localStorage.setItem(SHELF_KEY, JSON.stringify(books));
}

function getBook(id){
  return getBooks().find(b => b.id === id) || null;
}

function addBook(book){
  const books = getBooks();
  book.id = 'bk-' + Date.now().toString(36);
  books.unshift(book);
  saveBooks(books);
  return book;
}

function updateBook(id, changes){
  const books = getBooks();
  const idx = books.findIndex(b => b.id === id);
  if (idx === -1) return null;
  books[idx] = { ...books[idx], ...changes };
  saveBooks(books);
  return books[idx];
}

function deleteBook(id){
  const books = getBooks().filter(b => b.id !== id);
  saveBooks(books);
}

function callNumber(book){
  const prefix = (book.genre || 'GEN').slice(0, 3).toUpperCase();
  const suffix = book.id.replace('bk-', '').slice(-4).toUpperCase();
  return `${prefix} \u2013 ${suffix}`;
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function qs(param){
  return new URLSearchParams(window.location.search).get(param);
}

function showToast(message){
  let toast = document.querySelector('.toast');
  if (!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/** Wires a reusable delete-confirmation dialog. Returns a function
 *  confirmDelete(bookTitle, onConfirm) to trigger it. */
function setupConfirmDialog(){
  const veil = document.createElement('div');
  veil.className = 'veil';
  veil.innerHTML = `
    <div class="confirm-box" role="alertdialog" aria-modal="true">
      <h3>Remove this book?</h3>
      <p id="confirm-text">This takes it off the shelf for good. There's no undo.</p>
      <div class="confirm-actions">
        <button class="btn btn-quiet" id="confirm-cancel" type="button">Keep it</button>
        <button class="btn btn-danger" id="confirm-ok" type="button">Remove</button>
      </div>
    </div>`;
  document.body.appendChild(veil);

  const textEl = veil.querySelector('#confirm-text');
  const okBtn = veil.querySelector('#confirm-ok');
  const cancelBtn = veil.querySelector('#confirm-cancel');
  let pending = null;

  function close(){
    veil.classList.remove('show');
    pending = null;
  }

  okBtn.addEventListener('click', () => {
    if (pending) pending();
    close();
  });
  cancelBtn.addEventListener('click', close);
  veil.addEventListener('click', (e) => { if (e.target === veil) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && veil.classList.contains('show')) close();
  });

  return function confirmDelete(title, onConfirm){
    textEl.textContent = `"${title}" comes off the shelf for good. There's no undo.`;
    pending = onConfirm;
    veil.classList.add('show');
  };
}
