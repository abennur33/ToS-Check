let serviceInfo = null;

document.addEventListener('DOMContentLoaded', async () => {
  chrome.runtime.sendMessage({ action: 'getServiceInfo' }, response => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    serviceInfo = response.serviceInfo;

    if (serviceInfo) {
      // Populate the popup with service information
      document.getElementById('service-name').textContent = serviceInfo.parameters.name;
      document.getElementById('overall-rating').textContent = serviceInfo.parameters.rating;

      document.getElementById('service-name').textContent = serviceInfo.parameters.name;
      document.getElementById('overall-rating').textContent = serviceInfo.parameters.rating;
      const toggleGood = document.getElementById('toggle-good');
      const toggleNeutral = document.getElementById('toggle-neutral');
      const toggleBad = document.getElementById('toggle-bad');
      const pointsContainer = document.getElementById('points-container');

            
      toggleGood.addEventListener('change', () => {
        if (toggleGood.checked) {
          togglePoints('good');
        }
      });
            
      toggleNeutral.addEventListener('change', () => {
        if (toggleNeutral.checked) {
          togglePoints('neutral');
        }
      });
            
      toggleBad.addEventListener('change', () => {
        if (toggleBad.checked) {
          togglePoints('bad');
        }
      });
            
              // Function to toggle points based on classification
      function togglePoints(classification) {
        pointsContainer.innerHTML = ''; // Clear previous points
        pointsContainer.classList.remove('red', 'yellow', 'green');
            
        const servicePoints = serviceInfo.parameters.points;
        const filterPoints = servicePoints.filter(point => point.case.classification === classification);

        const uniquePoints = filterPoints.reduce((acc, point) => {
          if (!acc[point.title]) {
            acc[point.title] = point;
          }
          return acc;
        }, {});
            
                // Convert the object back to an array
        const filteredPoints = Object.values(uniquePoints);
            
                // Set the class based on the classification for the points container
        if (classification === 'bad') {
          pointsContainer.classList.add('red');
        } else if (classification === 'neutral') {
          pointsContainer.classList.add('yellow');
        } else if (classification === 'good') {
          pointsContainer.classList.add('green');
        }
      
        if (filteredPoints.length > 0) {
          const sortedPoints = filteredPoints.sort((a, b) => b.case.weight - a.case.weight);
          const visiblePoints = sortedPoints.slice(0, 5); // Show only the top 5 points
      
          const pointsList = document.createElement('ul');
          pointsList.classList.add('points-list');
      
          visiblePoints.forEach(point => {
            const listItem = document.createElement('li');
            listItem.textContent = point.title;
            pointsList.appendChild(listItem);
          });
      
          pointsContainer.appendChild(pointsList);
      
          if (sortedPoints.length > 5) {
            const showMoreButton = document.createElement('button');
            showMoreButton.textContent = 'Show More';
            showMoreButton.addEventListener('click', () => {
              // Show all the points when the "Show More" button is clicked
              pointsContainer.innerHTML = '';
              const fullPointsList = document.createElement('ul');
              fullPointsList.classList.add('points-list');
      
              sortedPoints.forEach(point => {
                const listItem = document.createElement('li');
                listItem.textContent = point.title;
                fullPointsList.appendChild(listItem);
              });
      
              pointsContainer.appendChild(fullPointsList);
            });
      
            pointsContainer.appendChild(showMoreButton);
          }
        } else {
          pointsContainer.textContent = 'No points found for the selected classification.';
        }
      }  
    }
    else {
      const startContent = document.querySelector(".start-content");
      const popupContent = document.querySelector(".popup-content");

      startContent.classList.remove("hidden");
      popupContent.classList.add("hidden");
    }
  });
});
