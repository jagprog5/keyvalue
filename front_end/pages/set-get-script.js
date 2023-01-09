const keyInput = document.getElementById('key-input');
const valueInput = document.getElementById('value-input');
const getButton = document.getElementById('get-button');
const setButton = document.getElementById('set-button');
const successLabel = document.getElementById('success-label');
const outputLabel = document.getElementById('output-label');

function setButtonOnClick() {
    outputLabel.innerText = "";
    let sessionToken = sessionStorage.getItem("sessionToken");
    let username = sessionStorage.getItem("username");
    if (sessionToken == null || username == null) {
        location.href = "/";
        return;
    }
    let fieldsGood = true;
    if (keyInput.value.length == 0) {
        keyInput.classList.add('error');
        fieldsGood = false;
    }
    if (valueInput.value.length == 0) {
        valueInput.classList.add('error');
        fieldsGood = false;
    }
    if (!fieldsGood) { return; }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/set-value');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
        if (xhr.status == 200) {
            valueInput.value = "";
            successLabel.style.opacity = 1;
            const fadeEffect = setInterval(() => {
                if (successLabel.style.opacity > 0) {
                    successLabel.style.opacity = parseFloat(successLabel.style.opacity) - 0.01;
                } else {
                    clearInterval(fadeEffect);
                }
            }, 10);
        } else if (xhr.status == 400) {
            location.href = "/"; // sessionToken was invalid. get a new one
        } else {
            alert('Err:' + xhr.status);
        }
    }
    const requestBody = {
        username: username,
        session_token: sessionToken,
        key: keyInput.value,
        value: valueInput.value,
    };
    xhr.send(JSON.stringify(requestBody));
}

valueInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        setButtonOnClick();
    }
});

setButton.addEventListener('click', setButtonOnClick);

function getButtonOnClick() {
    let sessionToken = sessionStorage.getItem("sessionToken");
    let username = sessionStorage.getItem("username");
    if (sessionToken == null || username == null) {
        location.href = "/";
        return;
    }
    let fieldsGood = true;
    if (keyInput.value.length == 0) {
        keyInput.classList.add('error');
        fieldsGood = false;
    }
    if (!fieldsGood) { return; }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/get-value');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
        if (xhr.status == 200) {
            outputLabel.style.opacity = 1;
            setTimeout(() => {
                const fadeEffect = setInterval(() => {
                    if (outputLabel.style.opacity > 0) {
                        outputLabel.style.opacity = parseFloat(outputLabel.style.opacity) - 0.01;
                    } else {
                        clearInterval(fadeEffect);
                        outputLabel.innerText = "";
                    }
                }, 10);
            }, 60000)
            outputLabel.innerText = xhr.responseText;
        } else if (xhr.status == 400) {
            location.href = "/"; // sessionToken was invalid. get a new one
        } else if (xhr.status == 404) {
            alert("key does not exist")
        } else {
            alert('Err:' + xhr.status);
        }
    }
    const requestBody = {
        username: username,
        session_token: sessionToken,
        key: keyInput.value,
        value: valueInput.value,
    };
    xhr.send(JSON.stringify(requestBody));
}

keyInput.addEventListener('keydown',  (event) => {
    if (event.key === 'Enter') {
        getButtonOnClick();
    }
});

getButton.addEventListener('click', getButtonOnClick);

valueInput.addEventListener('input',  () => {
    outputLabel.innerText = "";
    valueInput.classList.remove('error');
});

keyInput.addEventListener('input', () => {
    outputLabel.innerText = "";
    valueInput.classList.remove('error');
    keyInput.classList.remove('error');
});
