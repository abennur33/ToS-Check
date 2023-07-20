let signUpPageDetected = false;
let tabURL = null;
const intervalMap = {};
let signupURL = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    console.log("hi " + tab.url);
    if ((tab.url.startsWith('https://') || tab.url.startsWith('http://')) 
    && !tab.url.startsWith('https://www.google.com/search')
    && (tabURL == null || tabURL == tab.url)) {
      signUpPageDetected = false;
      checkForSignUp(tab);
    } else {
      clearInterval(intervalMap[tabURL]);
      tabURL = tab.url;
      checkForSignUp(tab);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getURL') {
    console.log("sending url: " + signupURL);
    // Retrieve the service info from local storage
    sendResponse({ signupURL });

    return true; // Enable asynchronous response
  }
});

function checkForSignUp(tab) {
  // Perform the initial check
  performCheck(tab);

  // Set a flag to track if a sign-up page is already detecte

  // Periodic checks every 5 seconds
  const interval = setInterval(() => {
    console.log(signUpPageDetected);
    if (!signUpPageDetected) {
      performCheck(tab);
    } else {
      clearInterval(interval);
      delete intervalMap[tab.url]; // Stop further periodic checks
    }
  }, 5000);

  // Stop periodic checks after 1 minute (12 checks)
  setTimeout(() => {
    clearInterval(interval);
    delete intervalMap[tab.url];
  }, 60000);

  intervalMap[tab.url] = interval;
}

function performCheck(tab) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: getDOM,
    },
    (results) => {
      if (chrome.runtime.lastError) {
        //console.error(chrome.runtime.lastError);
        return;
      }

      const content = results[0].result;

      if (isSignUpPage(content, tab.url)) {
        console.log("found signup");
        signupURL = tab.url;
        console.log(signupURL);
        chrome.windows.create({
          url: 'signUp.html',
          type: 'popup',
          focused: true,
          width: 420,
          height: 500
        });

        signUpPageDetected = true; // Set the flag to true once a sign-up page is detected
      }
    }
  );
}

// Rest of the code...


function getDOM() {
  return document.documentElement.innerText;
}

function isSignUpPage(pageContent, pageUrl) {
  if (pageUrl.startsWith('https://www.google.com/search')) {
    return false;
  }

  const urlKeywords = [
    "signup", "sign-up", "register", "join", "createaccount", "newuser", "create-account", "new-user", "get-started"
  ];

  const urlAntiKeywords = [
    "signin", "sign-in", "login", "log-in", "signon", "sign-on"
  ];


  const url = new URL(pageUrl);
  const pathname = url.pathname.toLowerCase();
  console.log(pathname);

  // Perform checks based on presence and counts
  if (
    checkURLKeywords(pathname, urlKeywords, urlAntiKeywords)
  ) {
    return true;
  }

  const keywords = [
    "sign up", "create account", "join now", "register", "new user",
    "get started", "start now", "signing up", "sign up now", "become a member",
    "free registration", "sign up for free", "join our community", "join for free"
  ];

  const weightedKeywords = {
    "sign up": 3, "create account": 2, "join now": 2, "register": 1, "new user": 1,
    "get started": 2, "start now": 2, "signing up": 1, "sign up now": 2, "become a member": 2,
    "free registration": 2, "sign up for free": 2, "join our community": 2, "join for free": 2
  };

  const keywordCombinations = [
    ["sign", "up"],
    ["create", "account"],
    ["join", "now"],
    ["register"],
    ["new", "user"],
    ["get", "started"],
    ["start", "now"],
    ["signing", "up"],
    ["sign", "up", "now"],
    ["become", "a", "member"],
    ["free", "registration"],
    ["sign", "up", "for", "free"],
    ["join", "our", "community"],
    ["join", "for", "free"]
  ];

  const antiKeywords = [
    "log in", "sign in", "login", "signin", "forgot", 
  ];

  const highWeightedKeywordThreshold = 2;
  const keywordCombinationThreshold = 2;

  const words = pageContent.toLowerCase().split(/\s+/);

  //console.log("in");
  console.log(words);

  let highWeightedKeywordCount = 0;
  let keywordCombinationCount = 0;
  let antiKeywordCount = 0;

  // Check keyword presence and weight
  for (const word of words) {
    if (keywords.includes(word)) {
      if (weightedKeywords[word] > 1) {
        highWeightedKeywordCount++;
      }
    }
  }

  for (const combination of keywordCombinations) {
    keywordCombinationCount += countKeywordCombinationOccurrences(words, combination);
  }

  // Check anti-keyword presence
  for (const word of words) {
    if (antiKeywords.includes(word)) {
      antiKeywordCount++;
    }
  }

  console.log(highWeightedKeywordCount);
  console.log(keywordCombinationCount);
  console.log(antiKeywordCount);

  if ((highWeightedKeywordCount >= highWeightedKeywordThreshold 
    || keywordCombinationCount >= keywordCombinationThreshold) 
    && antiKeywordCount <= 2
    && words.length <= 200) {
      return true;
  }

  return false;
}

function checkURLKeywords(pathname, urlKeywords, antiKeywords) {
  let keycount = 0;
  let anticount = 0;
  // Perform URL keyword checks
  for (const keyword of urlKeywords) {
    if (pathname.includes(keyword)) {
      keycount++; // At least one URL keyword is found in the pathname
    }
  }

  for (const antikey of antiKeywords) {
    if (pathname.includes(antikey)) {
      anticount++; // At least one URL keyword is found in the pathname
    }
  }

  if (anticount < 1 && keycount > 0) {
    return true;
  }

  return false; // No URL keyword is found
}


function countKeywordCombinationOccurrences(words, combination) {
  let count = 0;
  
  for (let i = 0; i <= words.length - combination.length; i++) {
    let match = true;
    
    for (let j = 0; j < combination.length; j++) {
      if (words[i + j] !== combination[j]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      count++;
    }
  }
  
  return count;
}
