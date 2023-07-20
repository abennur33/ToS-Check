document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("start-button");
  const spinner = document.getElementById("spinner");
  const startContent = document.querySelector(".start-content");

  const apiUrl = 'https://api.tosdr.org/service/v2';
  const totalPages = 80; // Total number of pages to fetch
  let matchFound = false; // Flag to track if a match is found
  let serviceID = null;

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
    console.log(serviceId);
    const serviceUrl = `${apiUrl}?id=${serviceId}`;
    console.log(serviceUrl);

    fetch(serviceUrl)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        chrome.storage.local.set({ serviceInfo: data });

        chrome.windows.create({
          url: 'popup.html',
          type: 'popup',
          width: 420,
          height: 500
        });
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getServiceInfo') {
      // Retrieve the service info from local storage
      chrome.storage.local.get(['serviceInfo'], result => {
        const serviceInfo = result.serviceInfo;
        sendResponse({ serviceInfo });
      });

      return true; // Enable asynchronous response
    }
  });

  // Start fetching data from the first page

  startButton.addEventListener('click', async () => {
    try {
      spinner.classList.remove("hidden"); // Show the loading spinner
      startButton.classList.add("hidden"); // Hide the button

      chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
        const activeTab = tabs[0];
        const url = new URL(activeTab.url);
        const baseDomain = url.hostname.replace(/^www\./, '');

        console.log('Base URL:', baseDomain);

        await fetchData(1, baseDomain);

        fetchServiceInfo(serviceID);

        spinner.classList.add("hidden"); // Show the loading spinner
        startButton.classList.remove("hidden"); // Hide the button
      });
    } catch (error) {
      console.error('Error:', error);
    }
  });
});