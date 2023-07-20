const apiUrl = 'https://api.tosdr.org/service/v2';
const totalPages = 80; // Total number of pages to fetch
let matchFound = false; // Flag to track if a match is found
let serviceID = null;
let newURL = null;
let serviceData = null;

function fetchData(page, baseUrl) {
  return new Promise((resolve, reject) => {
    if (!matchFound) {
      const url = `${apiUrl}?page=${page}`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          // Process the data for the current page here
          processPageData(data, baseUrl);

          // Check if a match is found
          if (!matchFound) {
            // Check if there are more pages to fetch
            if (page < totalPages) {
              // Make another API call for the next page
              resolve(fetchData(page + 1, baseUrl));
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        })
        .catch(error => {
          reject(error);
        });
    } else {
      resolve();
    }
  });
}

async function processPageData(data, baseUrl) {
  // Iterate over each service in the current page's data and perform necessary checks
  for (const service of data.parameters.services) {
    // Iterate over each URL in the current service
    for (const url of service.urls) {
      if (url === baseUrl) {
        serviceID = service.id;
        console.log('Found matching service:', serviceID);
        console.log(service);
        matchFound = true; // Set the flag to indicate a match is found
        return; // Exit the loop if a match is found
      }
    }
    if (matchFound) {
      break; // Exit the outer loop if a match is found
    }
  }
}

function fetchServiceInfo(serviceId) {
  return new Promise((resolve, reject) => {
    if (serviceId) {
      console.log(serviceId);
    } else {
      console.log('Service ID not found.');
      reject();
    }
    const serviceUrl = `${apiUrl}?id=${serviceId}`;
    console.log(serviceUrl);

    fetch(serviceUrl)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        serviceData = data;
        resolve();
      })
      .catch(error => {
        console.error('Error:', error);
        reject(error);
      });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("start-button");
  const spinner = document.getElementById("spinner");
  const popupContent = document.querySelector(".popup-content");
  const signUpNotification = document.getElementById("sign-up-notification");
  const termsInstruction = document.getElementById("terms-instruction");
  const startContent = document.querySelector(".start-content");

  popupContent.classList.add("hidden");

  startButton.addEventListener('click', async () => {

    chrome.runtime.sendMessage({ action: 'getURL' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      const newURL = response.signupURL;

      console.log("recieved " + newURL);

      try {
        spinner.classList.remove("hidden");
        startButton.style.display = 'none'; // Hide the button

        const url = new URL(newURL);
        const baseDomain = url.hostname.replace(/^www\./, '');
        console.log('Base URL:', baseDomain);

        await fetchData(1, baseDomain);

        await fetchServiceInfo(serviceID);

        spinner.classList.add("hidden"); // Hide the loading spinner

        if (serviceData != null) {
          serviceInfo = serviceData;
          popupContent.classList.remove("hidden"); // Show the popup content
          startContent.classList.add("hidden");
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
        } else {
          // Show a message indicating that no matching service is found
          popupContent.textContent = 'No matching service found for the website.';
          popupContent.classList.remove("hidden"); // Show the message
        }
      } catch (error) {
        console.error('Error:', error);
        // Show a message indicating an error occurred
        popupContent.textContent = 'An error occurred while fetching data.';
        popupContent.classList.remove("hidden"); // Show the message
        startButton.style.display = 'block';
        spinner.classList.add("hidden");
      }
    });
  });
});





