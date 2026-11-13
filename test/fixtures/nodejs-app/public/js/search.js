// browser code
const params = new URLSearchParams(location.search);
document.getElementById('term').innerHTML = params.get('q'); // @expect CWE-79
