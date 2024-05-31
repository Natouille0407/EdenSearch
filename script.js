const searchInput = document.querySelector("#searchInput");
const main = document.querySelector("main");

async function fetchResearch() {
    const query = searchInput.value.toLowerCase();
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Filtrer les résultats par correspondance exacte
        const exactMatches = data.links.filter(item => 
            item.title.toLowerCase() === query || 
            item.description.toLowerCase() === query
        );

        // Filtrer les résultats par correspondance partielle
        const partialMatches = data.links.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );

        // Ponderer les résultats
        const weightedResults = [...exactMatches, ...partialMatches];

        // Pagination (par exemple, affichage des 10 premiers résultats)
        const paginatedResults = weightedResults.slice(0, 10);

        displayResults(paginatedResults);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayResults(results) {
    main.innerHTML = '';
    if (results.length === 0) {
        main.innerHTML = '<p>No results found</p>';
        return;
    }

    results.forEach(item => {
        const article = document.createElement('article');
        const title = document.createElement('h2');
        const description = document.createElement('p');
        const link = document.createElement('a');

        title.textContent = item.title;
        description.textContent = item.description;
        link.href = item.link;
        link.textContent = 'Read more';

        article.appendChild(title);
        article.appendChild(description);
        article.appendChild(link);

        main.appendChild(article);
    });
}

searchInput.addEventListener("keydown", function(event) {
    console.log("Key pressed:", event.key); // Vérifiez si cet enregistrement apparaît dans la console du navigateur
    if (event.key === "Enter") {
        event.preventDefault(); // Empêche le rechargement de la page
        fetchResearch();
    }
});
