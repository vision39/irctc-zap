let finalData = {
  irctc_credentials: {},
  journey_details: {},
  extension_data: {
    book_at_tatkal_time: true,
  },
  passenger_details: [],
  infant_details: [],
  contact_details: {},
  gst_details: {},
  payment_preferences: {},
  travel_preferences: {},
  other_preferences: {},
};

const defaultValue = {
  gender: "M",
  nationality: "IN",
};

const errors = [];
let port;

window.addEventListener("load", () => {
  addDropdownOption(
    "from-station-input",
    "from-station-list",
    setFromStation,
    stationList,
    (q) => {
      return `<li data-english-label="${q.english_label}" data-hindi-label="${q.hindi_label}" data-station-code="${q.value}"  class="dropdown-list-item">${q.english_label} - ${q.value}</li>`;
    }
  );

  addDropdownOption(
    "destination-station-input",
    "destination-station-list",
    setDestinationStation,
    stationList,
    (q) => {
      return `<li data-english-label="${q.english_label}" data-hindi-label="${q.hindi_label}" data-station-code="${q.value}" class="dropdown-list-item">${q.english_label} - ${q.value}</li>`;
    }
  );

  addDropdownOption(
    "journey-class-input",
    "journey-class-list",
    setJourneyClass,
    classList,
    (q) => {
      return `<li class="dropdown-list-item" data-label="${q.label}" data-class="${q.value}">${q.label}</li>`;
    }
  );

  addDropdownOption("quota-input", "quota-list", setQuota, quotaList, (q) => {
    return `<li class="dropdown-list-item" data-label="${q.label}" data-quota="${q.value}">${q.label}</li>`;
  });

  addSelectOption("passenger-gender-1", passengerGenderList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}">${q.label}</li>`;
  });
  addSelectOption("passenger-gender-2", passengerGenderList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}">${q.label}</li>`;
  });
  addSelectOption("passenger-gender-3", passengerGenderList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}">${q.label}</li>`;
  });
  addSelectOption("passenger-gender-4", passengerGenderList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}">${q.label}</li>`;
  });

  addSelectOption("passenger-nationality-1", countryList, (q, i) => {
    return `<option class="dropdown-list-item" selected=${q.countryCode === "IN"
      } value="${q.countryCode}" data-label="${q.country
      }" data-index="${i}" data-nationality="${q.countryCode}">${q.country}</li>`;
  });
  addSelectOption("passenger-nationality-2", countryList, (q, i) => {
    if (q.countryCode === "IN") tempIndex = i;
    return `<option class="dropdown-list-item" value="${q.countryCode}" data-label="${q.country}" data-index="${i}" data-nationality="${q.countryCode}">${q.country}</li>`;
  });
  addSelectOption("passenger-nationality-3", countryList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.countryCode}" data-label="${q.country}" data-index="${i}" data-nationality="${q.countryCode}">${q.country}</li>`;
  });
  addSelectOption("passenger-nationality-4", countryList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.countryCode}" data-label="${q.country}" data-index="${i}" data-nationality="${q.countryCode}">${q.country}</li>`;
  });

  addSelectOption("reservationChoice", reservationChoiceList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}">${q.label}</li>`;
  });

  let indiaIndex = countryList.findIndex((c) => c.countryCode === "IN");
  document.querySelector("#passenger-nationality-1").selectedIndex = indiaIndex;
  document.querySelector("#passenger-nationality-2").selectedIndex = indiaIndex;
  document.querySelector("#passenger-nationality-3").selectedIndex = indiaIndex;
  document.querySelector("#passenger-nationality-4").selectedIndex = indiaIndex;
  document.querySelector("#book_at_tatkal_time").checked = true;

  addSelectOption("infant-gender-1", infantGenderList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}"><span>${q.label}</span></li>`;
  });
  addSelectOption("infant-gender-2", infantGenderList, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}"><span>${q.label}</span></li>`;
  });
  addSelectOption("infant-age-1", infantAge, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-age="${q.value}"><span>${q.label}</span></li>`;
  });
  addSelectOption("infant-age-2", infantAge, (q, i) => {
    return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-age="${q.value}"><span>${q.label}</span></li>`;
  });

  document
    .querySelector("#irctc-login")
    .addEventListener("change", setIRCTCUsername);
  document
    .querySelector("#irctc-password")
    .addEventListener("change", setIRCTCPassword);
  document
    .querySelector("#book_at_tatkal_time")
    .addEventListener("change", setFeatureDetails);
  document
    .querySelector("#from-station-input")
    .addEventListener("keyup", fromStationFilter);
  document
    .querySelector("#destination-station-input")
    .addEventListener("keyup", destinationStationFilter);
  document
    .querySelector("#journey-date")
    .addEventListener("keyup", journeyDateChanged);
  document
    .querySelector("#journey-class-input")
    .addEventListener("keyup", journeyClassFilter);
  document
    .querySelector("#quota-input")
    .addEventListener("keyup", journeyQuotaFilter);
  document
    .querySelector("#train-no")
    .addEventListener("change", setTrainNumber);
  for (let i = 0; i < 4; i++) {
    document
      .querySelector(`#passenger-name-${i + 1}`)
      .addEventListener("change", (e) =>
        setPassengerDetails(e, i, "passenger")
      );
    document
      .querySelector(`#age-${i + 1}`)
      .addEventListener("change", (e) =>
        setPassengerDetails(e, i, "passenger")
      );
    document
      .querySelector(`#passenger-gender-${i + 1}`)
      .addEventListener("change", (e) =>
        setPassengerDetails(e, i, "passenger")
      );
    document
      .querySelector(`#passenger-berth-${i + 1}`)
      .addEventListener("change", (e) =>
        setPassengerDetails(e, i, "passenger")
      );
    document
      .querySelector(`#passenger-nationality-${i + 1}`)
      .addEventListener("change", (e) =>
        setPassengerDetails(e, i, "passenger")
      );
  }
  for (let i = 0; i < 2; i++) {
    document
      .querySelector(`#infant-name-${i + 1}`)
      .addEventListener("change", (e) => setPassengerDetails(e, i, "infant"));
    document
      .querySelector(`#infant-age-${i + 1}`)
      .addEventListener("change", (e) => setPassengerDetails(e, i, "infant"));
    document
      .querySelector(`#infant-gender-${i + 1}`)
      .addEventListener("change", (e) => setPassengerDetails(e, i, "infant"));
  }

  document
    .querySelector("#gstin-number")
    .addEventListener("change", setGSTINDetails);
  document
    .querySelector("#gstin-name")
    .addEventListener("change", setGSTINDetails);
  document
    .querySelector("#gstin-flat")
    .addEventListener("change", setGSTINDetails);
  document
    .querySelector("#gstin-street")
    .addEventListener("change", setGSTINDetails);
  document
    .querySelector("#gstin-area")
    .addEventListener("change", setGSTINDetails);
  document
    .querySelector("#gstin-PIN")
    .addEventListener("change", setGSTINDetails);
  document
    .querySelector("#gstin-City")
    .addEventListener("change", setGSTINDetails);

  document
    .querySelector("#mobileNumber")
    .addEventListener("change", setContactDetails);
  document
    .querySelector("#email")
    .addEventListener("change", setContactDetails);

  document
    .querySelector("#autoUpgradation")
    .addEventListener("change", setOtherPreferences);
  document
    .querySelector("#confirmberths")
    .addEventListener("change", setOtherPreferences);
  document
    .querySelector("#reservationChoice")
    .addEventListener("change", setOtherPreferences);
  document
    .querySelector("#coachId")
    .addEventListener("change", setOtherPreferences);

  document
    .querySelector("#travelInsuranceOpted-1")
    .addEventListener("change", setTravelPreferences);
  document
    .querySelector("#travelInsuranceOpted-2")
    .addEventListener("change", setTravelPreferences);

  document
    .querySelector("#paymentType-1")
    .addEventListener("change", setPaymentPreferences);
  document
    .querySelector("#paymentType-2")
    .addEventListener("change", setPaymentPreferences);

  document.querySelector("#submit-btn").addEventListener("click", saveForm);
  document
    .querySelector("#load-btn-1")
    .addEventListener("click", () => loadUserData());
  document
    .querySelector("#clear-btn")
    .addEventListener("click", () => clearData());
  document
    .querySelector("#connect-btn")
    .addEventListener("click", connectWithBg);
});

//
// Filter functions for all dropdown
//
function fromStationFilter() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("from-station-input");
  filter = input.value.toUpperCase();
  ul = document.getElementById("from-station-list");
  li = ul.getElementsByTagName("li");

  for (i = 0; i < li.length; i++) {
    a = li[i];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function destinationStationFilter() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("destination-station-input");
  filter = input.value.toUpperCase();
  ul = document.getElementById("destination-station-list");
  li = ul.getElementsByTagName("li");

  for (i = 0; i < li.length; i++) {
    a = li[i];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function journeyClassFilter() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("journey-class-input");
  filter = input.value.toUpperCase();
  ul = document.getElementById("journey-class-list");
  li = ul.getElementsByTagName("li");

  for (i = 0; i < li.length; i++) {
    a = li[i];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function journeyQuotaFilter() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("quota-input");
  filter = input.value.toUpperCase();
  ul = document.getElementById("quota-list");
  li = ul.getElementsByTagName("li");

  for (i = 0; i < li.length; i++) {
    a = li[i];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

//
// Add options to all dropdowns
//
function addDropdownOption(
  inputId,
  optionListId,
  optionOnClick,
  options,
  renderOption
) {
  let dropdown;
  dropdown = document.querySelector(`#${inputId}`).parentElement;
  dropdown.querySelector(`#${optionListId}`).innerHTML = options
    .map(renderOption)
    .join("");
  [...(dropdown.querySelectorAll(`#${optionListId} li`) ?? [])].forEach((e) =>
    e.addEventListener("click", optionOnClick)
  );
}

function addSelectOption(selectId, options, renderOption) {
  let select;
  select = document.querySelector(`#${selectId}`);
  select.innerHTML = options.map(renderOption).join("");
}

function setBerthOptions(selectedClass) {
  addSelectOption(
    "passenger-berth-1",
    berthChoiceList[selectedClass],
    (q, i) => {
      return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}"><span>${q.label}</span></li>`;
    }
  );
  addSelectOption(
    "passenger-berth-2",
    berthChoiceList[selectedClass],
    (q, i) => {
      return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}"><span>${q.label}</span></li>`;
    }
  );
  addSelectOption(
    "passenger-berth-3",
    berthChoiceList[selectedClass],
    (q, i) => {
      return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}"><span>${q.label}</span></li>`;
    }
  );
  addSelectOption(
    "passenger-berth-4",
    berthChoiceList[selectedClass],
    (q, i) => {
      return `<option class="dropdown-list-item" value="${q.value}" data-label="${q.label}" data-index="${i}" data-gender="${q.value}"><span>${q.label}</span></li>`;
    }
  );
}

//
// Update Final Data
//

function setIRCTCUsername(e) {
  if (!finalData["irctc_credentials"]) finalData["irctc_credentials"] = {};
  finalData["irctc_credentials"]["user_name"] = e.target.value;
  console.log("data-update", finalData);
}

function setIRCTCPassword(e) {
  finalData["irctc_credentials"]["password"] = e.target.value;
  console.log("data-update", finalData);
}

function setFromStation(e) {
  finalData["journey_details"]["from"] = {
    hindi_label: e.target.dataset["hindiLabel"],
    english_label: e.target.dataset["englishLabel"],
    station_code: e.target.dataset["stationCode"],
  };
  document.querySelector(
    "#from-station-input"
  ).value = `${e.target.dataset["englishLabel"]} - ${e.target.dataset["stationCode"]}`;
}
function setDestinationStation(e) {
  finalData["journey_details"]["destination"] = {
    hindi_label: e.target.dataset["hindiLabel"],
    english_label: e.target.dataset["englishLabel"],
    station_code: e.target.dataset["stationCode"],
  };
  document.querySelector(
    "#destination-station-input"
  ).value = `${e.target.dataset["englishLabel"]} - ${e.target.dataset["stationCode"]}`;
}
function setJourneyClass(e) {
  finalData["journey_details"]["class"] = {
    label: e.target.dataset["label"],
    value: e.target.dataset["class"],
  };
  document.querySelector(
    "#journey-class-input"
  ).value = `${e.target.dataset["label"]}`;
  setBerthOptions(e.target.dataset["class"]);
}
function setQuota(e) {
  finalData["journey_details"]["quota"] = {
    label: e.target.dataset["label"],
    value: e.target.dataset["quota"],
  };
  document.querySelector("#quota-input").value = `${e.target.dataset["label"]}`;
}

function journeyDateChanged(e) {
  finalData["journey_details"]["date"] = e.target.value;
}
function setTrainNumber(e) {
  finalData["journey_details"]["train-no"] = e.target.value;
}

function setPassengerDetails(e, index, type) {
  if (type === "infant") {
    if (!finalData["infant_details"][index])
      finalData["infant_details"][index] = {};
    finalData["infant_details"][index][e.target.name] = e.target.value;
  } else {
    if (!finalData["passenger_details"][index])
      finalData["passenger_details"][index] = {};
    finalData["passenger_details"][index][e.target.name] = e.target.value;
  }
}
function setContactDetails(e) {
  if (!finalData["contact_details"]) finalData["contact_details"] = {};
  finalData["contact_details"][e.target.name] = e.target.value;
}
function setGSTINDetails(e) {
  if (!finalData["gst_details"]) finalData["gst_details"] = {};
  finalData["gst_details"][e.target.name] = e.target.value;
}
function setOtherPreferences(e) {
  if (!finalData["other_preferences"]) finalData["other_preferences"] = {};
  finalData["other_preferences"][e.target.name] =
    e.target.type === "checkbox" ? e.target.checked : e.target.value;
}
function setPaymentPreferences(e) {
  if (!finalData["payment_preferences"]) finalData["payment_preferences"] = {};
  finalData["payment_preferences"][e.target.name] =
    e.target.type === "checkbox" ? e.target.checked : e.target.value;
}
function setTravelPreferences(e) {
  if (!finalData["travel_preferences"]) finalData["travel_preferences"] = {};
  finalData["travel_preferences"][e.target.name] =
    e.target.type === "checkbox" ? e.target.checked : e.target.value;
}
function setFeatureDetails(e) {
  if (!finalData["extension_data"]) finalData["extension_data"] = {};
  finalData["extension_data"][e.target.name] =
    e.target.type === "checkbox" ? e.target.checked : e.target.value;
}

// function setData(i) {
//   const temp_data = i == 1 ? user_data : user_data_with_gst;
//   finalData["irctc_credentials"] = temp_data["irctc_credentials"] ?? {};
//   finalData["journey_details"] = temp_data["journey_details"] ?? {};
//   finalData["passenger_details"] = temp_data["passenger_details"] ?? [];
//   finalData["infant_details"] = temp_data["infant_details"] ?? [];
//   finalData["contact_details"] = temp_data["contact_details"] ?? {};
//   finalData["gst_details"] = temp_data["gst_details"] ?? {};
//   finalData["payment_preferences"] = temp_data["payment_preferences"] ?? {};
//   finalData["travel_preferences"] = temp_data["travel_preferences"] ?? {};
//   finalData["other_preferences"] = temp_data["other_preferences"] ?? {};
// }

function modifyUserData() {
  try {
    if (finalData["passenger_details"]) {
      finalData["passenger_details"] = finalData["passenger_details"]
        .filter((p) => p.name && p.name.length > 0 && p.age && p.age.length > 0)
        .map((p) => ({
          name: p.name,
          age: p.age,
          gender: p.gender ?? "M",
          berth:
            p.berth ??
            (finalData["journey_details"]?.class?.value && berthChoiceList[finalData["journey_details"].class.value] ? berthChoiceList[finalData["journey_details"].class.value][0].value : ""),
          nationality: "IN",
        }));
    }
    if (finalData["infant_details"]) {
      finalData["infant_details"] = finalData["infant_details"]
        .filter((p) => p.name && p.name.length > 0 && p.age && p.age.length > 0)
        .map((p) => ({
          name: p.name,
          age: p.age ?? infantAge[0].value,
          gender: p.gender ?? "M",
        }));
    }
    if (finalData["gst_details"]) {
      finalData["gst_details"] = finalData["gst_details"]["gstin-number"]
        ? finalData["gst_details"]
        : undefined;
    }
  } catch (e) {
    throw new Error("Error processing user data: " + e.message);
  }
}

function loadUserData() {
  chrome.storage.local.get(null, (loadData) => {
    if (chrome.runtime.lastError) {
      showToast("Error loading data: " + chrome.runtime.lastError.message, "error");
      return;
    }
    if (!loadData || Object.keys(loadData).length === 0) {
      showToast("No saved data found!", "error");
      console.log("No saved data found");
      return;
    }

    try {
      // Credentials
      if (loadData.irctc_credentials) {
        document.querySelector("#irctc-login").value =
          loadData.irctc_credentials.user_name ?? "";
        document.querySelector("#irctc-password").value =
          loadData.irctc_credentials.password ?? "";
      }

      // Journey details
      if (loadData.journey_details) {
        if (loadData.journey_details.from) {
          document.querySelector("#from-station-input").value =
            `${loadData.journey_details.from.english_label ?? ""} - ${loadData.journey_details.from.station_code ?? ""}`;
        }
        if (loadData.journey_details.destination) {
          document.querySelector("#destination-station-input").value =
            `${loadData.journey_details.destination.english_label ?? ""} - ${loadData.journey_details.destination.station_code ?? ""}`;
        }
        if (loadData.journey_details.date) {
          document.querySelector("#journey-date").value =
            loadData.journey_details.date;
        }
        if (loadData.journey_details.class) {
          document.querySelector("#journey-class-input").value =
            loadData.journey_details.class.label ?? "";
          setBerthOptions(loadData.journey_details.class.value);
        }
        if (loadData.journey_details.quota) {
          document.querySelector("#quota-input").value =
            loadData.journey_details.quota.label ?? "";
        }
        if (loadData.journey_details["train-no"]) {
          document.querySelector("#train-no").value =
            loadData.journey_details["train-no"];
        }
      }

      // Passenger details
      if (loadData.passenger_details) {
        loadData.passenger_details.forEach((passenger, index) => {
          const nameEl = document.querySelector(`#passenger-name-${index + 1}`);
          const ageEl = document.querySelector(`#age-${index + 1}`);
          const genderEl = document.querySelector(`#passenger-gender-${index + 1}`);
          const berthEl = document.querySelector(`#passenger-berth-${index + 1}`);
          const natEl = document.querySelector(`#passenger-nationality-${index + 1}`);
          if (nameEl) nameEl.value = passenger.name ?? "";
          if (ageEl) ageEl.value = passenger.age ?? "";
          if (genderEl) genderEl.value = passenger.gender ?? "M";
          if (berthEl) berthEl.value = passenger.berth ?? "";
          if (natEl) natEl.value = passenger.nationality ?? "IN";
        });
      }

      // Infant details
      if (loadData.infant_details) {
        loadData.infant_details.forEach((infant, index) => {
          const nameEl = document.querySelector(`#infant-name-${index + 1}`);
          const ageEl = document.querySelector(`#age-${index + 1}`);
          const genderEl = document.querySelector(`#infant-gender-${index + 1}`);
          if (nameEl) nameEl.value = infant.name ?? "";
          if (ageEl) ageEl.value = infant.age ?? "";
          if (genderEl) genderEl.value = infant.gender ?? "M";
        });
      }

      // Contact details
      if (loadData.contact_details) {
        const mobileEl = document.querySelector("#mobileNumber");
        if (mobileEl) mobileEl.value = loadData.contact_details.mobileNumber ?? "";
      }

      // GST details
      if (loadData.gst_details) {
        const gstFields = ["gstin-number", "gstin-name", "gstin-flat", "gstin-street", "gstin-area", "gstin-PIN", "gstin-City"];
        gstFields.forEach((field) => {
          const el = document.querySelector(`#${field}`);
          if (el) el.value = loadData.gst_details[field] ?? "";
        });
      }

      // Payment preferences
      if (loadData.payment_preferences?.paymentType) {
        const payEl = document.querySelector(
          `input[name="paymentType"][value="${loadData.payment_preferences.paymentType}"]`
        );
        if (payEl) payEl.checked = true;
      }

      // Travel preferences
      if (loadData.travel_preferences?.travelInsuranceOpted) {
        const travelEl = document.querySelector(
          `input[name="travelInsuranceOpted"][value="${loadData.travel_preferences.travelInsuranceOpted}"]`
        );
        if (travelEl) travelEl.checked = true;
      }

      // Other preferences
      if (loadData.other_preferences && Object.keys(loadData.other_preferences).length > 0) {
        const autoEl = document.querySelector("#autoUpgradation");
        if (autoEl) autoEl.checked = loadData.other_preferences.autoUpgradation ?? false;
        const confEl = document.querySelector("#confirmberths");
        if (confEl) confEl.checked = loadData.other_preferences.confirmberths ?? false;
        const coachEl = document.querySelector("#coachId");
        if (coachEl) coachEl.value = loadData.other_preferences.coachId ?? "";
        if (loadData.other_preferences.reservationChoice) {
          const resEl = document.querySelector("#reservationChoice");
          if (resEl) resEl.value = loadData.other_preferences.reservationChoice ?? "";
        }
      }

      finalData = loadData;
      showToast("Data loaded successfully!", "success");
      console.log("Data loaded successfully", finalData);
    } catch (e) {
      showToast("Error loading data: " + e.message, "error");
      console.error(e);
    }
  });
}

function getMsg(msg_type, msg_body) {
  return {
    msg: {
      type: msg_type,
      data: msg_body,
    },
    sender: "popup",
    id: "irctc",
  };
}

// Deep merge: only overwrite saved values if the new value is non-empty
function mergeData(saved, current) {
  const merged = { ...saved };
  for (const key in current) {
    if (current[key] === undefined || current[key] === null) continue;

    if (Array.isArray(current[key])) {
      // For arrays (passenger_details, infant_details): use current if it has entries
      if (current[key].length > 0) {
        merged[key] = current[key];
      }
    } else if (typeof current[key] === "object") {
      // For nested objects: merge field by field, skip empty strings
      merged[key] = merged[key] ?? {};
      for (const subKey in current[key]) {
        const val = current[key][subKey];
        if (val !== undefined && val !== null && val !== "") {
          merged[key][subKey] = val;
        }
      }
    } else if (current[key] !== "") {
      // For primitive values: only overwrite if non-empty
      merged[key] = current[key];
    }
  }
  return merged;
}

function readCurrentFormData() {
  // Read credentials from input fields
  const userName = document.querySelector("#irctc-login").value?.trim() ?? "";
  const password = document.querySelector("#irctc-password").value ?? "";
  if (userName || password) {
    if (!finalData["irctc_credentials"]) finalData["irctc_credentials"] = {};
    if (userName) finalData["irctc_credentials"]["user_name"] = userName;
    if (password) finalData["irctc_credentials"]["password"] = password;
  }

  // Read journey date
  const journeyDate = document.querySelector("#journey-date").value;
  if (journeyDate) {
    if (!finalData["journey_details"]) finalData["journey_details"] = {};
    finalData["journey_details"]["date"] = journeyDate;
  }

  // Read passenger details actively
  for (let i = 0; i < 4; i++) {
    const nameStr = document.querySelector(`#passenger-name-${i + 1}`)?.value;
    const ageStr = document.querySelector(`#age-${i + 1}`)?.value;
    if (nameStr || ageStr) {
      if (!finalData["passenger_details"]) finalData["passenger_details"] = [];
      if (!finalData["passenger_details"][i]) finalData["passenger_details"][i] = {};
      finalData["passenger_details"][i]["name"] = nameStr;
      finalData["passenger_details"][i]["age"] = ageStr;

      const gender = document.querySelector(`#passenger-gender-${i + 1}`)?.value;
      if (gender) finalData["passenger_details"][i]["gender"] = gender;

      const berth = document.querySelector(`#passenger-berth-${i + 1}`)?.value;
      if (berth) finalData["passenger_details"][i]["berth"] = berth;

      const nationality = document.querySelector(`#passenger-nationality-${i + 1}`)?.value;
      if (nationality) finalData["passenger_details"][i]["nationality"] = nationality;
    }
  }

  // Read infant details actively
  for (let i = 0; i < 2; i++) {
    const nameStr = document.querySelector(`#infant-name-${i + 1}`)?.value;
    const ageStr = document.querySelector(`#infant-age-${i + 1}`)?.value;
    if (nameStr || ageStr) {
      if (!finalData["infant_details"]) finalData["infant_details"] = [];
      if (!finalData["infant_details"][i]) finalData["infant_details"][i] = {};
      finalData["infant_details"][i]["name"] = nameStr;
      finalData["infant_details"][i]["age"] = ageStr;

      const gender = document.querySelector(`#infant-gender-${i + 1}`)?.value;
      if (gender) finalData["infant_details"][i]["gender"] = gender;
    }
  }
}

function saveForm() {
  try {
    readCurrentFormData();
    modifyUserData();
    // Load existing data first, then merge
    chrome.storage.local.get(null, (savedData) => {
      const dataToSave = mergeData(savedData || {}, finalData);
      chrome.storage.local.set(dataToSave, () => {
        if (chrome.runtime.lastError) {
          showToast("Error saving data: " + chrome.runtime.lastError.message, "error");
        } else {
          finalData = dataToSave;
          showToast("Data saved successfully!", "success");
          console.log("Data saved", finalData);
        }
      });
    });
  } catch (e) {
    showToast("Error saving data: " + e.message, "error");
    console.error(e);
  }
}
function clearData() {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      showToast("Error clearing data: " + chrome.runtime.lastError.message, "error");
    } else {
      showToast("Data cleared successfully!", "success");
    }
  });
}

function connectWithBg() {
  try {
    readCurrentFormData();
    modifyUserData();
    chrome.storage.local.get(null, (savedData) => {
      const dataToSave = mergeData(savedData || {}, finalData);
      chrome.storage.local.set(dataToSave, () => {
        if (chrome.runtime.lastError) {
          console.error("Error auto-saving:", chrome.runtime.lastError);
        }
        finalData = dataToSave;
        startScript();
      });
    });
  } catch (e) {
    console.error("Auto-save error:", e);
    startScript();
  }
}

function startScript() {
  chrome.runtime.sendMessage(
    getMsg("activate_script", finalData),
    (response) => {
      console.log(response, "activate_script response");
      showToast("Connected to IRCTC tab!", "success");
    }
  );
}

// EA, FC, VC, VS  - no berth preference available

document.getElementById('toggle-password').addEventListener('click', function () {
  const passwordInput = document.getElementById('irctc-password');
  const eyeOpen = document.getElementById('eye-icon-open');
  const eyeClosed = document.getElementById('eye-icon-closed');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  } else {
    passwordInput.type = 'password';
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  }
});

// Toast Notification System
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;

  const checkIcon = `<svg class="toast-icon" viewBox="0 0 52 52"><circle class="toast-circle" cx="26" cy="26" r="25" /><path class="toast-check" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>`;
  const crossIcon = `<svg class="toast-icon" viewBox="0 0 52 52"><circle class="toast-circle" cx="26" cy="26" r="25" /><path class="toast-cross" d="M16 16 36 36 M36 16 16 36"/></svg>`;
  const infoIcon = `<svg class="toast-icon" viewBox="0 0 52 52"><circle class="toast-circle" cx="26" cy="26" r="25" /><path class="toast-info-line" d="M26 22v15 M26 14h.01"/></svg>`;

  let iconHtml = type === "success" ? checkIcon : type === "error" ? crossIcon : infoIcon;
  toast.innerHTML = `${iconHtml}<span class="toast-text">${message}</span>`;

  container.appendChild(toast);

  // Slide in and fade up effect
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
