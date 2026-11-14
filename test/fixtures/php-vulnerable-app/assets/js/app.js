var params = new URLSearchParams(window.location.search);
document.getElementById('welcome').innerHTML = 'Welcome back, ' + params.get('name'); // @expect CWE-79
