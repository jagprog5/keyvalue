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

function loginButtonOnClick() {
  let fieldsGood = true;
  if (usernameInput.value.length == 0) {
    usernameInput.classList.add('error');
    fieldsGood = false;
  }
  sessionStorage.setItem("username", usernameInput.value);
  if (passwordInput.value.length == 0) {
    passwordInput.classList.add('error');
    fieldsGood = false;
  }
  if (!fieldsGood) { return; }
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', '/login');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = () => {
    if (xhr.status == 200) {
      const sessionToken = xhr.responseText;
      sessionStorage.setItem("sessionToken", sessionToken);
      location.href = "/pages/set-get-page.html";
    } else if (xhr.status == 400) {
      alert('Incorrect or expired username or password');
    } else if (xhr.status == 503) {
      alert('Rate limit reached');
    } else {
      alert('Err:' + xhr.status);
    }
  }
  const requestBody = {
    username: usernameInput.value,
    password: passwordInput.value,
  };
  xhr.send(JSON.stringify(requestBody));
}

passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loginButtonOnClick();
  }
});

usernameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loginButtonOnClick();
  }
});

loginButton.addEventListener('click', loginButtonOnClick);

createAccountButton.addEventListener('click', () => {
  clearErrors();
  if (usernameInput.value.length != 0) {
    sessionStorage.setItem("username", usernameInput.value);
  }
  location.href = "/pages/create-account.html";
});
