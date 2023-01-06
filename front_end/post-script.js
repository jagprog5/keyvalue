// script loaded at end of body

// prefetch theme toggle images. otherwise there is a noticable delay before display
var lightPreload = new Image();
var lightHoverPreload = new Image();
var darkPreload = new Image();
var darkHoverPreload = new Image();
lightPreload.src = 'assets/light-theme.png';
lightHoverPreload.src = 'assets/light-theme-hover.png';
darkPreload.src = 'assets/dark-theme.png';
darkHoverPreload.src = 'assets/dark-theme-hover.png';

const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', function () {
  theme = theme == TOGGLED ? DEFAULT : TOGGLED;
  localStorage.setItem(THEME, theme);

  let elems = document.querySelectorAll('*');
  for (i = 0; i < elems.length; ++i) {
    elems[i].classList.toggle(TOGGLED);
  }
});

// if password and repeat don't match, colorize for feedback
const passwordInput = document.getElementById('password');
const repeatPasswordInput = document.getElementById('repeat-password');
function checkMatching() {
  passwordInput.classList.remove('error');
  repeatPasswordInput.classList.remove('error');
  if (passwordInput.value == repeatPasswordInput.value
          || passwordInput.value.length == 0
          || repeatPasswordInput.value.length == 0) {
    repeatPasswordInput.classList.remove('warn');
  } else {
    repeatPasswordInput.classList.add('warn');
  }
}
passwordInput.addEventListener('input', checkMatching);
repeatPasswordInput.addEventListener('input', checkMatching);

// 3 instances of same functionality. not worth creating class
const usernameInput = document.getElementById('username');
usernameInput.addEventListener('input', function () {
  usernameInput.classList.remove('error');
});

const keyInput = document.getElementById('key');
keyInput.addEventListener('input', function () {
  keyInput.classList.remove('error');
});

const valueInput = document.getElementById('value');
valueInput.addEventListener('input', function () {
  valueInput.classList.remove('error');
});

// give error highlights where needed
function validateAndHighlightCommonInputs() {
  let good = true;
  if (usernameInput.value.length == 0) {
    usernameInput.classList.add('error');
    good = false;
  }
  if (passwordInput.value != repeatPasswordInput.value
          || passwordInput.value.length == 0) {
    passwordInput.classList.add('error');
    repeatPasswordInput.classList.add('error');
    good = false;
  }
  if (keyInput.value.length == 0) {
    keyInput.classList.add('error');
    good = false;
  }
  return good;
}

const setButton = document.getElementById('set-btn');
setButton.addEventListener('click', function () {
  let good = validateAndHighlightCommonInputs();
  if (valueInput.value.length == 0) {
    valueInput.classList.add('error');
    good = false;
  }
  if (good) {
    alert('send it!');
  }
});

const getButton = document.getElementById('get-btn');
getButton.addEventListener('click', function () {
  let good = validateAndHighlightCommonInputs();
  if (good) {
    alert('get it!');
  }
});
