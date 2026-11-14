var greeting = document.getElementById('greeting');
greeting.textContent = 'Hi ' + decodeURIComponent(location.hash.slice(1));
