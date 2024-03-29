// if password and repeat don't match, colorize for feedback
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const repeatPasswordInput = document.getElementById('repeat-password-input');
const createAccountButton = document.getElementById('create-account-button');

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

usernameInput.addEventListener('input', () => {
    usernameInput.classList.remove('error');
});


function createAccountButtonOnClick() {
    let fieldsGood = true;
    if (usernameInput.value.length == 0) {
        usernameInput.classList.add('error');
        fieldsGood = false;
    }
    sessionStorage.setItem("username", usernameInput.value);

    let passFieldEmpty = false;
    if (passwordInput.value.length == 0) {
        passwordInput.classList.add('error');
        fieldsGood = false;
        passFieldEmpty = true;
    }

    if (repeatPasswordInput.value.length == 0) {
        repeatPasswordInput.classList.add('error');
        fieldsGood = false;
        passFieldEmpty = true;
    }

    if (!passFieldEmpty && passwordInput.value != repeatPasswordInput.value) {
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

function inputKeyDownHandle(event) {
    if (event.key === 'Enter') {
        createAccountButtonOnClick();
    }
}

usernameInput.addEventListener('keydown', inputKeyDownHandle);
passwordInput.addEventListener('keydown', inputKeyDownHandle);
repeatPasswordInput.addEventListener('keydown', inputKeyDownHandle);
createAccountButton.addEventListener('click', createAccountButtonOnClick);
