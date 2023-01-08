const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const createAccountButton = document.getElementById('create-account-button');

function clearErrors() {
  usernameInput.classList.remove('error');
  passwordInput.classList.remove('error');
}

usernameInput.addEventListener('input', clearErrors);
passwordInput.addEventListener('input', clearErrors);

createAccountButton.addEventListener('click', function(){
  clearErrors();
  location.href = "/pages/create-account.html";
});

loginButton.addEventListener('click', function () {
  let good = true;
  if (usernameInput.value.length == 0) {
    usernameInput.classList.add('error');
    good = false;
  }
  if (passwordInput.value.length == 0) {
    passwordInput.classList.add('error');
    good = false;
  }
  if (good) {
    alert('send login!');
  }
});
