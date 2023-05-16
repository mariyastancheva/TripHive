import '@babel/polyfill';
import {login, logout, signup} from './login';
import {displayMap} from './mapbox';
import { updateData } from './updateSettings';
import { bookTour } from './stripe';

// ELEMENTS
const map = document.getElementById('map')
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// LOADING SPINNER
const showLoading = () => {
    document.getElementById('loader').style.display = 'flex';
    document.getElementsByClassName('main')[0].style.display = 'none';
}

const hideLoading = () => {
    document.getElementById('loader').style.display = 'none';
    document.getElementsByClassName('main')[0].style.display = 'block';
}
// DELEGATION
if (map){
    const locations = JSON.parse(map.dataset.locations);

    displayMap(locations);
}

if(signupForm){
    signupForm.addEventListener('submit', e =>{
        e.preventDefault();
        showLoading();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        signup(name, email, password, passwordConfirm).finally(() => hideLoading());
    })
}
if (loginForm) {
    loginForm.addEventListener('submit', e =>{
        e.preventDefault();
        showLoading();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password).finally(() => hideLoading());
    })
}
if (logOutBtn){
    logOutBtn.addEventListener('click', logout);
}

if(userDataForm){
    userDataForm.addEventListener('submit', async e =>{
        e.preventDefault();
        showLoading();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        await updateData(form, 'data');
        hideLoading();
        window.location.reload(true);
    })
}

if(userPasswordForm){
    userPasswordForm.addEventListener('submit', async (e) =>{
        e.preventDefault();
        showLoading();
        const btn = document.querySelector('.btn--save-password');
        btn.textContent = 'Loading';

        const password = document.getElementById('password-current').value;
        const newPassword = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateData({password, newPassword, passwordConfirm}, 'password');
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
        btn.textContent = 'SAVE PASSWORD';a
        hideLoading();
    })
}

if(bookBtn){
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...'
        const tourId = e.target.dataset.tourId;
        bookTour(tourId);
    })
}