// The local URL is selected only when this page is opened on a local host.
// Do not put MongoDB credentials or backend secrets in frontend configuration.
const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);

window.APP_CONFIG = {
  API_BASE_URL: isLocalDevelopment
    ? 'http://localhost:8000'
    : 'https://backsr-o2lumthh7-null-pointers18.vercel.app'
};
