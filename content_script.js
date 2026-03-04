let user_data = {};

function getMsg(msg_type, msg_body) {
  return {
    msg: {
      type: msg_type,
      data: msg_body,
    },
    sender: "content_script",
    id: "irctc",
  };
}
function statusUpdate(status) {
  chrome.runtime.sendMessage(
    getMsg("status_update", { status, time: Date.now() })
  );
}

// --- Utilities ---

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForElement(selector, parent = document, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = parent.querySelector(selector);
    if (el) return el;
    await sleep(300);
  }
  console.warn(`[IRCTC Autofill] Element not found: ${selector}`);
  return null;
}

function setNativeValue(element, value) {
  try {
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;
    const ownValueSetter = Object.getOwnPropertyDescriptor(
      element,
      "value"
    )?.set;
    const setter =
      ownValueSetter && ownValueSetter !== prototypeValueSetter
        ? prototypeValueSetter
        : ownValueSetter || prototypeValueSetter;
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
  } catch (e) {
    element.value = value;
  }
}

function triggerInputEvents(element) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

function setInputValue(element, value) {
  if (!element) return;
  setNativeValue(element, value);
  triggerInputEvents(element);
}

// --- Message Listener ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message, sender, "content_script");
  if (message.id !== "irctc") {
    sendResponse("Invalid Id");
    return;
  }
  const type = message.msg.type;
  if (type === "selectJourney") {
    setTimeout(() => selectJourney(), 500);
  } else if (type === "fillPassengerDetails") {
    setTimeout(() => fillPassengerDetails(), 500);
  }
  sendResponse("Message received");
});

// --- Login ---

async function loadLoginDetails() {
  statusUpdate("login_started");
  const loginModal = await waitForElement("app-login", document, 10000);
  if (!loginModal) {
    console.error("[IRCTC Autofill] Login modal not found");
    return;
  }

  const userNameInput = await waitForElement(
    "input[formcontrolname='userid']",
    loginModal,
    5000
  );
  const passwordInput = await waitForElement(
    "input[formcontrolname='password']",
    loginModal,
    5000
  );

  if (userNameInput) {
    setInputValue(
      userNameInput,
      user_data["irctc_credentials"]?.["user_name"] ?? ""
    );
    console.log("[IRCTC Autofill] Username filled");
  } else {
    console.error("[IRCTC Autofill] Username input not found");
  }

  if (passwordInput) {
    setInputValue(
      passwordInput,
      user_data["irctc_credentials"]?.["password"] ?? ""
    );
    console.log("[IRCTC Autofill] Password filled");
  } else {
    console.error("[IRCTC Autofill] Password input not found");
  }

  // Click the SIGN IN button
  await sleep(500);
  const submitBtn = loginModal.querySelector(
    "button[type='submit'].search_btn"
  );
  if (submitBtn) {
    submitBtn.click();
    console.log("[IRCTC Autofill] Login button clicked");
  } else {
    console.error("[IRCTC Autofill] Login submit button not found");
  }

  statusUpdate("login_pending");

  // Wait for login to complete (LOGOUT button appears or Login Modal disappears)
  console.log("[IRCTC Autofill] Waiting for login to complete...");
  let attempts = 0;
  while (attempts < 30) { // Max 15 seconds
    await sleep(500);

    // Check 1: Is there a LOGOUT link anywhere?
    const links = [...document.querySelectorAll("a, span, button")];
    const hasLogout = links.some(el => el.innerText.trim().toUpperCase() === "LOGOUT");

    // Check 2: Is the login button still there? (If not, we logged in)
    const loginLink = document.querySelector("a.search_btn.loginText.ng-star-inserted");
    const isLoginGone = !loginLink || loginLink.innerText.trim().toUpperCase() !== "LOGIN";

    // Check 3: Did the modal close?
    const isModalOpen = document.querySelector("app-login");

    if (hasLogout || (isLoginGone && !isModalOpen && attempts > 4)) {
      console.log("[IRCTC Autofill] Login successful, proceeding to journey details");
      await loadJourneyDetails();
      return;
    }
    attempts++;
  }
  console.warn("[IRCTC Autofill] Login confirmation timeout. Falling back to loadJourneyDetails()");
  await loadJourneyDetails();
}

// --- Journey Details ---

// Helper: Fill a PrimeNG p-autocomplete field by typing and selecting from dropdown
async function autocompleteFill(inputElement, searchText, stationCode) {
  if (!inputElement) return false;

  // Focus the input
  inputElement.focus();
  inputElement.click();
  await sleep(200);

  // Clear existing value
  setNativeValue(inputElement, "");
  inputElement.dispatchEvent(new Event("input", { bubbles: true }));
  await sleep(200);

  // Type the station code to trigger autocomplete
  setNativeValue(inputElement, stationCode);
  inputElement.dispatchEvent(new Event("input", { bubbles: true }));
  inputElement.dispatchEvent(new Event("keyup", { bubbles: true }));
  console.log(`[IRCTC Autofill] Typed "${stationCode}" into autocomplete`);

  // Wait for the autocomplete dropdown list to appear
  // PrimeNG autocomplete uses the aria-controls attribute to link to the list
  const listId = inputElement.getAttribute("aria-controls");
  let listItems = [];

  // Try multiple times to find dropdown items
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(500);

    // Method 1: Try by aria-controls ID
    if (listId) {
      const listEl = document.getElementById(listId);
      if (listEl) {
        listItems = [...listEl.querySelectorAll("li")];
        if (listItems.length > 0) break;
      }
    }

    // Method 2: Try finding any visible autocomplete panel
    const panels = document.querySelectorAll(
      ".ui-autocomplete-panel .ui-autocomplete-list-item, .ui-autocomplete-panel li"
    );
    if (panels.length > 0) {
      listItems = [...panels];
      break;
    }
  }

  if (listItems.length === 0) {
    console.warn(
      `[IRCTC Autofill] No autocomplete results found for "${stationCode}"`
    );
    // Fallback: just set the full text value
    setNativeValue(inputElement, searchText);
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    return false;
  }

  console.log(
    `[IRCTC Autofill] Found ${listItems.length} autocomplete results`
  );

  // Find matching item — match by station code
  const matchItem =
    listItems.find((li) =>
      li.innerText.toUpperCase().includes(stationCode.toUpperCase())
    ) || listItems[0]; // fallback to first item

  if (matchItem) {
    matchItem.click();
    console.log(
      `[IRCTC Autofill] Selected: "${matchItem.innerText.trim()}"`
    );
    await sleep(300);
    return true;
  }

  return false;
}

// Helper: Select a PrimeNG p-dropdown item by label
async function dropdownSelect(dropdownContainer, label) {
  if (!dropdownContainer || !label) return false;

  // Click the dropdown trigger to open it
  const triggerBtn = dropdownContainer.querySelector("div[role='button']");
  if (triggerBtn) {
    triggerBtn.click();
  } else {
    dropdownContainer.click();
  }
  console.log(`[IRCTC Autofill] Opened dropdown, looking for "${label}"`);

  await sleep(500);

  // PrimeNG dropdown panels can be appended to body, so search document-wide
  // Find all visible dropdown panels
  const panels = document.querySelectorAll(
    ".ui-dropdown-panel, .p-dropdown-panel"
  );
  let allItems = [];
  for (const panel of panels) {
    const items = panel.querySelectorAll("li, .ui-dropdown-item, .p-dropdown-item");
    if (items.length > 0) {
      allItems = [...items];
      break;
    }
  }

  // Also check within the container itself
  if (allItems.length === 0) {
    allItems = [...dropdownContainer.querySelectorAll("ul li")];
  }

  if (allItems.length === 0) {
    console.warn(`[IRCTC Autofill] No dropdown items found for "${label}"`);
    return false;
  }

  console.log(
    `[IRCTC Autofill] Found ${allItems.length} dropdown items`
  );

  const matchItem = allItems.find(
    (e) => e.innerText.trim().toUpperCase() === label.trim().toUpperCase()
  );

  if (matchItem) {
    matchItem.click();
    console.log(`[IRCTC Autofill] Selected dropdown: "${matchItem.innerText.trim()}"`);
    await sleep(300);
    return true;
  } else {
    console.warn(`[IRCTC Autofill] Dropdown item "${label}" not found`);
    // Close dropdown by clicking trigger again
    if (triggerBtn) triggerBtn.click();
    return false;
  }
}

async function loadJourneyDetails() {
  statusUpdate("filling_journey_details");
  const form = await waitForElement("app-jp-input form");
  if (!form) {
    console.error("[IRCTC Autofill] Journey form not found");
    return;
  }
  console.log("[IRCTC Autofill] Journey form found, filling details...");

  // Launch all field filling tasks concurrently
  const fillTasks = [];

  // 1. From Station
  fillTasks.push((async () => {
    const fromInputField = await waitForElement('input[aria-label*="From station"]', form, 5000);
    if (!fromInputField) {
      const fallback = await waitForElement("#origin input, #origin > span > input", form, 3000);
      if (fallback && user_data["journey_details"]?.["from"]) {
        await autocompleteFill(
          fallback,
          `${user_data["journey_details"]["from"]["english_label"]} - ${user_data["journey_details"]["from"]["station_code"]}`,
          user_data["journey_details"]["from"]["station_code"]
        );
      }
    } else if (user_data["journey_details"]?.["from"]) {
      await autocompleteFill(
        fromInputField,
        `${user_data["journey_details"]["from"]["english_label"]} - ${user_data["journey_details"]["from"]["station_code"]}`,
        user_data["journey_details"]["from"]["station_code"]
      );
    }
    console.log("[IRCTC Autofill] From station done");
  })());

  // 2. Destination Station
  fillTasks.push((async () => {
    const destInputField = await waitForElement('input[aria-label*="To station"]', form, 5000);
    if (!destInputField) {
      const fallback = await waitForElement("#destination input, #destination > span > input", form, 3000);
      if (fallback && user_data["journey_details"]?.["destination"]) {
        await autocompleteFill(
          fallback,
          `${user_data["journey_details"]["destination"]["english_label"]} - ${user_data["journey_details"]["destination"]["station_code"]}`,
          user_data["journey_details"]["destination"]["station_code"]
        );
      }
    } else if (user_data["journey_details"]?.["destination"]) {
      await autocompleteFill(
        destInputField,
        `${user_data["journey_details"]["destination"]["english_label"]} - ${user_data["journey_details"]["destination"]["station_code"]}`,
        user_data["journey_details"]["destination"]["station_code"]
      );
    }
    console.log("[IRCTC Autofill] Destination station done");
  })());

  // 3. Date
  fillTasks.push((async () => {
    const dateInputField = await waitForElement("span.ui-calendar input", form, 5000);
    if (!dateInputField) {
      const fallback = await waitForElement("#jDate > span > input, #jDate input", form, 3000);
      if (fallback && user_data["journey_details"]?.["date"]) {
        const formattedDate = user_data["journey_details"]["date"].split("-").reverse().join("/");
        setInputValue(fallback, formattedDate);
      }
    } else if (user_data["journey_details"]?.["date"]) {
      const formattedDate = user_data["journey_details"]["date"].split("-").reverse().join("/");
      dateInputField.focus();
      dateInputField.click();
      await sleep(200);
      setNativeValue(dateInputField, formattedDate);
      dateInputField.dispatchEvent(new Event("input", { bubbles: true }));
      dateInputField.dispatchEvent(new Event("change", { bubbles: true }));
      dateInputField.dispatchEvent(new Event("blur", { bubbles: true }));
      await sleep(200);
      form.click();
      console.log(`[IRCTC Autofill] Date set to: ${formattedDate}`);
    }
  })());

  // Wait a tiny bit for the dropdowns since their panels share the same document-level space
  // We can still run them partially concurrently, but better to sequentialize just the dropdown actions
  // to prevent overlapping panel issues.
  fillTasks.push((async () => {
    // 4. Journey Class
    const jClassField = await waitForElement("#journeyClass", form, 5000);
    if (jClassField && user_data["journey_details"]?.["class"]) {
      await dropdownSelect(jClassField, user_data["journey_details"]["class"]["label"]);
      console.log("[IRCTC Autofill] Journey class done");
    }

    // 5. Quota (Requires class to finish first to avoid double-opening panels)
    await sleep(300);
    const quotaField = await waitForElement("#journeyQuota", form, 5000);
    if (quotaField && user_data["journey_details"]?.["quota"]) {
      await dropdownSelect(quotaField, user_data["journey_details"]["quota"]["label"]);
      console.log("[IRCTC Autofill] Quota done");
    }
  })());

  // Wait for all fields to finish populating
  await Promise.all(fillTasks);

  // Search button
  await sleep(1000); // Give Angular another second to sync all changes
  const searchBtn = form.querySelector(
    "button.search_btn.train_Search[type='submit']"
  );
  statusUpdate("filled_journey_details");
  console.log("[IRCTC Autofill] All journey details filled concurrently");

  if (
    user_data["journey_details"]?.["quota"]?.["label"] === "TATKAL" ||
    (user_data["journey_details"]?.["quota"]?.["label"] === "PREMIUM TATKAL" &&
      user_data["extension_data"]?.["book_at_tatkal_time"] === true)
  ) {
    const jclass = user_data["journey_details"]["class"]["value"];
    let currentDate = new Date();
    let requiredDate = new Date();
    ["1A", "2A", "3A", "CC", "EC", "3E"].includes(jclass.toUpperCase())
      ? requiredDate.setHours(10, 0, 0, 0)
      : requiredDate.setHours(11, 0, 0, 0);

    if (requiredDate > currentDate) {
      const waitTime = requiredDate - currentDate;
      console.log(`[IRCTC Autofill] Waiting ${waitTime}ms for tatkal time`);
      setTimeout(() => {
        if (searchBtn) searchBtn.click();
      }, waitTime);
    } else {
      if (searchBtn) searchBtn.click();
    }
  } else {
    if (searchBtn) searchBtn.click();
  }
}

// --- Select Journey (train-list page) ---

async function selectJourney() {
  if (!user_data["journey_details"]?.["train-no"]) return;

  statusUpdate("journey_selection_started");
  const train_list_parent = await waitForElement(
    "#divMain > div > app-train-list"
  );
  if (!train_list_parent) return;

  await sleep(1000);

  const train_list = [
    ...train_list_parent.querySelectorAll(".tbis-div app-train-avl-enq"),
  ];
  console.log(
    "[IRCTC Autofill] Looking for train:",
    user_data["journey_details"]["train-no"]
  );
  const myTrain = train_list.find((train) => {
    const heading = train.querySelector("div.train-heading");
    return (
      heading &&
      heading.innerText.trim().includes(user_data["journey_details"]["train-no"])
    );
  });

  if (!myTrain) {
    statusUpdate("journey_selection_stopped.no_train");
    console.error("[IRCTC Autofill] Train not found in list");
    return;
  }

  const jClass = user_data["journey_details"]["class"]["label"];
  const tempDate = new Date(user_data["journey_details"]["date"])
    .toString()
    .split(" ");
  const myClassToClick = [
    ...myTrain.querySelectorAll("table tr td div.pre-avl"),
  ].filter((c) => c.querySelector("div")?.innerText === jClass)[0];

  const config = { attributes: false, childList: true, subtree: true };
  [...myTrain.querySelectorAll("table tr td div.pre-avl")]
    .filter((c) => c.querySelector("div")?.innerText === jClass)[0]
    ?.click();

  const fetchAvailableSeatsCallback = async (mutationList, observer) => {
    console.log("[IRCTC Autofill] fetchAvailableSeatsCallback", Date.now());
    await sleep(800);
    const myClassToClick = [
      ...myTrain.querySelectorAll("table tr td div.pre-avl"),
    ].filter((c) => c.querySelector("div")?.innerText === jClass)[0];
    const myClassTabToClick = [
      ...myTrain.querySelectorAll(
        "div p-tabmenu ul[role='tablist'] li[role='tab']"
      ),
    ].filter((c) => c.querySelector("div")?.innerText === jClass)[0];
    const myClassTabToSelect = [
      ...myTrain.querySelectorAll("div div table td div.pre-avl"),
    ].filter(
      (c) =>
        c.querySelector("div")?.innerText ===
        `${tempDate[0]}, ${tempDate[2]} ${tempDate[1]}`
    )[0];

    const bookBtn = myTrain.querySelector(
      "button.btnDefault.train_Search.ng-star-inserted"
    );
    if (myClassToClick) {
      if (myClassToClick.classList.contains("selected-class")) {
        statusUpdate("journey_selection_completed");
        await sleep(300);
        if (bookBtn) bookBtn.click();
        observer.disconnect();
      } else {
        await sleep(300);
        myClassToClick.click();
      }
    } else if (myClassTabToClick) {
      if (!myClassTabToClick.classList.contains("ui-state-active")) {
        await sleep(300);
        myClassTabToClick.click();
        return;
      } else if (myClassTabToSelect) {
        if (myClassTabToSelect.classList.contains("selected-class")) {
          await sleep(500);
          if (bookBtn) bookBtn.click();
          observer.disconnect();
        } else {
          await sleep(500);
          myClassTabToSelect.click();
        }
      }
    }
  };
  const observer = new MutationObserver(fetchAvailableSeatsCallback);
  observer.observe(myTrain, config);
}

// --- Fill Passenger Details (psgninput page) ---

async function fillPassengerDetails() {
  statusUpdate("passenger_filling_started");
  const parentElement = await waitForElement("app-passenger-input");
  if (!parentElement) return;

  await sleep(500);

  // Add extra passenger rows
  let count = 1;
  while (count < (user_data["passenger_details"]?.length ?? 0)) {
    await sleep(300);
    const addBtn = parentElement.querySelector(
      "#ui-panel-12-content div.zeroPadding.pull-left.ng-star-inserted a span.prenext"
    );
    if (addBtn) addBtn.click();
    count++;
  }

  // Add infant rows
  count = 0;
  while (count < (user_data["infant_details"]?.length ?? 0)) {
    await sleep(300);
    const addInfantBtn = parentElement.querySelector(
      "#ui-panel-12-content div.zeroPadding.text-right.ng-star-inserted > a > span.prenext"
    );
    if (addInfantBtn) addInfantBtn.click();
    count++;
  }

  await sleep(500);

  const passengerList = [...parentElement.querySelectorAll("app-passenger")];
  const infantList = [...parentElement.querySelectorAll("app-infant")];

  // passenger details
  if (user_data["passenger_details"]) {
    user_data["passenger_details"].forEach((passenger, index) => {
      if (!passengerList[index]) return;
      const pEl = passengerList[index];

      const nameField = pEl.querySelector(
        "p-autocomplete[formcontrolname='passengerName'] input"
      );
      setInputValue(nameField, passenger.name);

      const ageField = pEl.querySelector(
        "input[formcontrolname='passengerAge']"
      );
      setInputValue(ageField, passenger.age);

      const genderField = pEl.querySelector(
        "select[formcontrolname='passengerGender']"
      );
      if (genderField) {
        setNativeValue(genderField, passenger.gender ?? "M");
        genderField.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const berthField = pEl.querySelector(
        "select[formcontrolname='passengerBerthChoice']"
      );
      if (berthField) {
        setNativeValue(berthField, passenger.berth ?? "");
        berthField.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // infant details
  if (user_data["infant_details"]) {
    user_data["infant_details"].forEach((infant, index) => {
      if (!infantList[index]) return;
      const iEl = infantList[index];

      const nameField = iEl.querySelector("input[name='infant-name']");
      setInputValue(nameField, infant.name);

      const ageField = iEl.querySelector("select[formcontrolname='age']");
      if (ageField) {
        setNativeValue(ageField, infant.age);
        ageField.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const genderField = iEl.querySelector(
        "select[formcontrolname='gender']"
      );
      if (genderField) {
        setNativeValue(genderField, infant.gender ?? "M");
        genderField.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // contact details
  const numberField = parentElement.querySelector(
    "input[formcontrolname='mobileNumber']"
  );
  if (numberField) {
    setInputValue(numberField, user_data["contact_details"]?.mobileNumber ?? "");
  }

  // Other preferences
  const autoUpgradationInput = parentElement.querySelector(
    "input[formcontrolname='autoUpgradationSelected']"
  );
  if (autoUpgradationInput) {
    autoUpgradationInput.checked =
      user_data["other_preferences"]?.["autoUpgradation"] ?? false;
    autoUpgradationInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const confirmberthsInput = parentElement.querySelector(
    "input[formcontrolname='bookOnlyIfCnf']"
  );
  if (confirmberthsInput) {
    confirmberthsInput.checked =
      user_data["other_preferences"]?.["confirmberths"] ?? false;
    confirmberthsInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const preferredCoachInput = parentElement.querySelector(
    "input[formcontrolname='coachId']"
  );
  if (preferredCoachInput) {
    setInputValue(
      preferredCoachInput,
      user_data["other_preferences"]?.["coachId"] ?? ""
    );
  }

  // Reservation choice dropdown
  const reservationChoiceField = parentElement.querySelector(
    "p-dropdown[formcontrolname='reservationChoice']"
  );
  if (reservationChoiceField && user_data["other_preferences"]?.["reservationChoice"]) {
    const reservationChoiceArrowBtn = reservationChoiceField.querySelector(
      "div > div[role='button']"
    );
    if (reservationChoiceArrowBtn) {
      reservationChoiceArrowBtn.click();
      await sleep(300);
      const items = [...reservationChoiceField.querySelectorAll("ul li")];
      const itemToSelect = items.find(
        (e) =>
          e.innerText.trim() ===
          (user_data["other_preferences"]["reservationChoice"] ?? "").trim()
      );
      if (itemToSelect) itemToSelect.click();
    }
  }

  // insurance details
  await sleep(300);
  const insuranceOptionsRadios = [
    ...parentElement.querySelectorAll(
      "p-radiobutton[formcontrolname='travelInsuranceOpted'] input[type='radio']"
    ),
  ];
  const insuranceValue =
    user_data["travel_preferences"]?.travelInsuranceOpted === "yes"
      ? "true"
      : "false";
  const insuranceRadio = insuranceOptionsRadios.find(
    (r) => r.value === insuranceValue
  );
  if (insuranceRadio) insuranceRadio.click();

  // payment details
  await sleep(300);
  const paymentOptionsRadios = [
    ...parentElement.querySelectorAll(
      "p-radiobutton[formcontrolname='paymentType'] input[type='radio']"
    ),
  ];
  if (user_data["payment_preferences"]?.paymentType) {
    const paymentRadio = paymentOptionsRadios.find(
      (r) => r.value === user_data["payment_preferences"].paymentType.toString()
    );
    if (paymentRadio) paymentRadio.click();
  }

  // GSTIN details
  if (user_data["gst_details"]?.["gstin-number"]) {
    await sleep(400);
    const gst_form = parentElement.querySelector("app-gst-input");
    if (gst_form) {
      const gstin_number_field = gst_form.querySelector("#gstin-number");
      setInputValue(gstin_number_field, user_data["gst_details"]["gstin-number"]);

      const gstin_name_field = gst_form.querySelector("#gstin-name");
      setInputValue(gstin_name_field, user_data["gst_details"]["gstin-name"]);

      const gstin_flat_field = gst_form.querySelector("#gstin-flat");
      setInputValue(gstin_flat_field, user_data["gst_details"]["gstin-flat"]);

      const gstin_street_field = gst_form.querySelector("#gstin-street");
      setInputValue(gstin_street_field, user_data["gst_details"]["gstin-street"]);

      const gstin_area_field = gst_form.querySelector("#gstin-area");
      setInputValue(gstin_area_field, user_data["gst_details"]["gstin-area"]);

      const gstin_PIN_field = gst_form.querySelector("#gstin-PIN");
      setInputValue(gstin_PIN_field, user_data["gst_details"]["gstin-PIN"]);

      const gstin_City_field = gst_form.querySelector("select#gstin-City");
      if (gstin_City_field && gstin_PIN_field) {
        // Wait for city options to load after PIN is entered
        const cityConfig = {
          attributes: true,
          childList: true,
          subtree: true,
        };
        const cityFetchCallback = (mutationList, observer) => {
          if (
            gstin_PIN_field.value.length === 6 &&
            gstin_City_field.querySelectorAll("option").length > 1
          ) {
            observer.disconnect();
            setNativeValue(
              gstin_City_field,
              user_data["gst_details"]["gstin-City"]
            );
            gstin_City_field.dispatchEvent(
              new Event("change", { bubbles: true })
            );
            submitPassengerDetailsForm(parentElement);
          }
        };
        const observer = new MutationObserver(cityFetchCallback);
        observer.observe(gstin_City_field, cityConfig);
      } else {
        submitPassengerDetailsForm(parentElement);
      }
    } else {
      submitPassengerDetailsForm(parentElement);
    }
  } else {
    submitPassengerDetailsForm(parentElement);
  }
}

async function submitPassengerDetailsForm(parentElement) {
  statusUpdate("passenger_filling_completed");
  console.log("[IRCTC Autofill] Passenger details completed", Date.now());
  statusUpdate("passenger_data_submitting");
  await sleep(800);
  console.log("[IRCTC Autofill] Submitting", Date.now());
  const submitBtn = parentElement.querySelector(
    "#psgn-form > form div > button.train_Search.btnDefault[type='submit']"
  );
  if (submitBtn) submitBtn.click();
  statusUpdate("passenger_data_submitted");
}

// --- Main Entry Point ---

async function continueScript() {
  statusUpdate("continue_script");
  console.log("[IRCTC Autofill] continueScript called, URL:", window.location.href);

  if (window.location.href.includes("train-search")) {
    // Wait for login button to appear
    const loginBtn = await waitForElement(
      "a.search_btn.loginText.ng-star-inserted",
      document,
      10000
    );

    if (!loginBtn) {
      console.error("[IRCTC Autofill] Login button not found");
      return;
    }

    const btnText = loginBtn.innerText.trim().toUpperCase();
    console.log("[IRCTC Autofill] Login button text:", btnText);

    if (btnText.includes("LOGOUT")) {
      console.log("[IRCTC Autofill] Already logged in, filling journey details");
      await loadJourneyDetails();
    } else if (btnText.includes("LOGIN")) {
      console.log("[IRCTC Autofill] Not logged in, clicking login button");
      loginBtn.click();
      await sleep(500);
      await loadLoginDetails();
    }
  } else if (window.location.href.includes("booking/train-list")) {
    console.log("[IRCTC Autofill] On train list page");
    await selectJourney();
  } else if (window.location.href.includes("booking/psgninput")) {
    console.log("[IRCTC Autofill] On passenger input page");
    await fillPassengerDetails();
  } else {
    console.log("[IRCTC Autofill] No matching page for script");
  }
}

// --- Init ---

(async function initContentScript() {
  console.log("[IRCTC Autofill] Content script loaded, readyState:", document.readyState);

  // Load saved user data from storage
  user_data = await new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      resolve(result);
    });
  });
  console.log("[IRCTC Autofill] User data loaded from storage", Object.keys(user_data));

  if (!user_data || Object.keys(user_data).length === 0) {
    console.error("[IRCTC Autofill] No saved data found. Please fill the form and click SAVE DATA first.");
    return;
  }

  await continueScript();
})();
