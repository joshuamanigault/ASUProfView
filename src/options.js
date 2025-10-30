document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(
        ['compactCards', 'darkMode'],
        (options) => {
            document.getElementById('compactCards').checked = options.compactCards ?? false;
            document.getElementById('darkMode').checked = options.darkMode ?? false;
        });
});

document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
        const { id, checked } = event.target;

        chrome.storage.sync.set({ [id]: checked }, () => {
            console.log(`Saved option ${id}: ${checked}`);
        });

        const status = document.createElement('span');
        status.textContent = "saved";
        status.style.color = "green";
        status.style.marginLeft = "8px";

        event.target.parentNode.appendChild(status);
        
        setTimeout(() => status.remove(), 1000);
    });
});

