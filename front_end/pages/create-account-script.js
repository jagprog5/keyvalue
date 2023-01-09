// if password and repeat don't match, colorize for feedback
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const createAccountButton = document.getElementById('create-account-button');

const repeatPasswordInput = document.getElementById('repeat-password-input');
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

function createAccountButtonOnClick() {
    let fieldsGood = true;
    if (usernameInput.value.length == 0) {
        usernameInput.classList.add('error');
        fieldsGood = false;
    }
    sessionStorage.setItem("username", usernameInput.value);
    if (passwordInput.value != repeatPasswordInput.value
        || passwordInput.value.length == 0) {
        passwordInput.classList.add('error');
        repeatPasswordInput.classList.add('error');
        fieldsGood = false;
    }
    if (!fieldsGood) { return; }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/create-account');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
        if (xhr.status == 200) {
            const sessionToken = xhr.responseText;
            sessionStorage.setItem("sessionToken", sessionToken);
            location.href = "/pages/set-get-page.html";
        } else if (xhr.status == 409) {
            alert('Username already exists.');
        } else if (xhr.status == 400) {
            alert('Incorrect or expired username or password');
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

repeatPasswordInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        createAccountButtonOnClick();
    }
});

usernameInput.addEventListener('input', function () {
    usernameInput.classList.remove('error');
});

createAccountButton.addEventListener('click', createAccountButtonOnClick);
