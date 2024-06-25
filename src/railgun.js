// Get version of Railgun, for crafting requests
let VERSION = chrome.runtime.getManifest().version;

// Default values
let USER = localStorage.getItem("rguser");
let rotitle = localStorage.getItem("rgrotitle") || "Railgun";
let suctitle = localStorage.getItem("rgsuctitle") || "Task Failed Successorly";
let govtitle = localStorage.getItem("rggovtitle") || "Maintain A";
let JUMP_POINT = localStorage.getItem("rgjumppoint") || "suspicious";
let MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine")) || []
let safety = JSON.parse(localStorage.getItem("rgsafety")) || false;

// Load settings
const getting = chrome.storage.sync.get();
getting.then(loadSettings, settingsFailed);

// Identification strings
let USER_AGENT = `Railgun/${VERSION} (By: Volstrostia; usedBy: ${USER})`;
let USER_URL = `Railgun_${VERSION}_by_Volstrostia_usedBy_${USER}`; // For chrome

// Prepare buttons for simultaneity
prepareButtons();

// Each time the main page loads, gather important values from it
var localid = some("localid") || localStorage.getItem("rglocalid");
var chk = some("chk") || localStorage.getItem("rgchk");

// Gather current nation
var nationlinks = document.getElementsByClassName("bellink");
if (nationlinks.length > 0) { 
	var nation = nationlinks[0].href.split("=")[1];
} else { 
	var nation = localStorage.getItem("rgnation");
}

// Gather current region. Panel value is later overwritten during move. 
var regionpanel = grab("panelregionbar");
if (regionpanel) { 
	var region = regionpanel.children[0].href.split("=")[1];
	console.log(`Got region from panel ${region}`);
} else { 
	console.log("Could not get panel");
	var region = localStorage.getItem("rgregion");
}

// Write back freshest values into local cache
localStorage.setItem("rglocalid", localid);
localStorage.setItem("rgchk", chk); // Useful for stuff like resignation
localStorage.setItem("rgnation", nation); // Current nation
localStorage.setItem("rgregion", region); // Current region

console.debug(`LocalID: ${localid} | chk: ${chk}`);

// If we're opening a new region page, check the region cache
// If it's the current region, noop (refresh, etc.)
// However, if it's not, then update the cache
// We will not be opening new regions more than once per second,
// I don't care how cracked you are, so we can skip the API 
// rate limit.
if (document.location.href.includes("region=")) { 
	let current_region = document.location.href.split("region=")[1].split("/")[0];
	var region_cache = localStorage.getItem("rgregioncache");
	if (region_cache) { 
		region_cache = JSON.parse(region_cache);

		// Different region than the last one, or cache is more than 30 seconds old
		if (region_cache["region_name"] != current_region || region_cache["cache_built"] <= Date.now() - 30_000) { 
			if (region_cache["bucket_empty"]) { 
				warnStatus("Out of API slots\nSpinning until bucket reset");
				while (region_cache["bucket_reset"] > Date.now()) { 
					;
				}
				successStatus("Done waiting for API to clear - proceed!");
			}
			console.log(`Replacing existing cache with ${current_region}`);
			buildCache(current_region);
		} else { 
			// E.g. moves, refresh, anything that doesn't change the region we're interested in
			console.log(`Region cache for ${current_region} already exists, ignoring`);
		}
	} else { 
		// No cache found
		console.log(`Building cache for ${current_region}`);
		buildCache(current_region);
	}
} 

// Ensure user values are present, and lock out if not
if (USER && USER != "" && USER != "null") {
	updStatus(`Railgun ${VERSION} loaded\nCurrent user: ${USER}\nApplications available: ${MAGAZINE.length}\nCurrent nation: ${nation}\nCurrent region: ${region}\nAwaiting command`);
} else { 
	failStatus("User could not be pulled from settings.\nAdditional setup is likely required");
	lockSimul();
}

// Check if we are banned from the region we're looking at
if (document.location.href.includes("region=")) { 
	let current_region = document.location.href.split("region=")[1].split("/")[0];
	if (region_cache && region_cache["region_name"] == current_region && region_cache["banlist"].includes(nation)) { 
		failStatus(`Warning: intel suggests ${nation} is banned from ${current_region}\nConsider switching to a different puppet\nYou have ${MAGAZINE.length} puppets remaining`);
	}
}

// Keyboard event listener
document.addEventListener('keyup', function(event) { 
	if (USER == "") { 
		failStatus("Cannot perform activity without user ID. Edit settings and refresh.");
		lockSimul();
		return;
	} else if (event.shiftKey || event.ctrlKey || event.altKey || document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') { // locks you out of the script while you're holding down a modifier key or typing in an input
		return;
	} else {
		// Extra safeguard - if simultaneity in effect, drop any keybinds
		if (window.simulLocked) { 
			warnStatus("Cannot process, simultaneity in effect!");
			return;
		}

		// Any other key than I pressed while safety is engaged
		if (safety && event.code != 'KeyI') { 
			warnStatus("Safety is on - press I to disengage");
			return;
		}
		
		switch (event.code) { // event.code is the key that was pressed
			// Interlock/Safety - refuse to process further keystrokes until it is lifted
			case 'KeyI':
				if (safety) { 
					safety = false;
					localStorage.setItem("rgsafety", false);
					successStatus("Safety disengaged\nNormal operation permitted");
				} else { 
					safety = true;
					localStorage.setItem("rgsafety", true);
					warnStatus("Safety engaged\nPress I to resume normal operation");
				}

				break;

			// Rebuild the region cache, regardless of last cache build time or region
			case 'KeyC':
				console.log("Force-rebuilding cache");
				var current_region = region;
				if (window.location.href.includes("region=")) {
					current_region = document.location.href.split("region=")[1].split("/")[0];
				}

				var region_cache = localStorage.getItem("rgregioncache");
				if (region_cache) { 
					region_cache = JSON.parse(region_cache);
					// Check if we are out of API requests in this bucket, and refuse to make more if so
					if (region_cache["bucket_empty"] && Date.now() <= region_cache["bucket_reset"]) { 
						failStatus(`Out of API slots, try again in ${(Date.now() - region_cache["bucket_reset"] / 1000)} seconds`);
					} else { 
						console.log("Refreshing cache");
						buildCache(current_region);
						successStatus(`Cache rebuilt for ${current_region}`);
						var region_cache = localStorage.getItem("rgregioncache");
					}
				} else { 
					// No cache found
					console.log(`Building cache for ${current_region}`);
					buildCache(current_region);
					successStatus("Cache built");
					var region_cache = localStorage.getItem("rgregioncache");
				}
				
				break;

			// Clear magazine
			case 'KeyM':
				if (window.confirm("Are you sure you want to clear your magazine?")) { 
					MAGAZINE = [];
					localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));
					successStatus("Cleared magazine");
				}
				break;

			// Add application to magazine
			case 'KeyL':
				// Catch freshest values
				MAGAZINE = JSON.parse(localStorage.getItem("rgmagazine")) || []
				if (!document.location.href.includes("join_WA")) {
					failStatus("Cannot load applications if not on application page");
				} else { 
					let appid = document.getElementsByName("appid")[0].value;
					let appnation = document.getElementsByClassName("button primary icon approve big")[0].form.children.nation.value;
					let foundApplication = false;
					for (i=0; i<MAGAZINE.length;i++) { 
						if (MAGAZINE[i]["appid"] == appid) { 
							failStatus("Application already in magazine");
							foundApplication = true;
							break;
						}
					}

					if (!foundApplication) { 
						MAGAZINE.push({"nation": appnation, "appid": appid});
						localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));
						successStatus(`Added ${appnation} to magazine\nCurrent magazine length: ${MAGAZINE.length}`);
					}
				}
				break;

			// Join WA
			case 'KeyR': 
				if (MAGAZINE.length == 0) { 
					failStatus("No applications left in magazine!");
				} else { 
					// Remove application from stack in memory and flash updated list to system
					// Use SHIFT for FIFO feeding - just load tabs in the order desired
					let next_up = MAGAZINE.shift()
					localStorage.setItem("rgmagazine", JSON.stringify(MAGAZINE));

					let appnation = next_up["nation"]
					let appid = next_up["appid"]
					updStatus(`Joining the World Assembly with ${appnation}`);

					makeRequest(
						"/cgi-bin/join_un.cgi", 
						`nation=${appnation}&appid=${appid}`, 
						joinCallback
					);
				}
				break;

			// Resign WA
			case 'KeyE': 
				updStatus("Resigning from the World Assembly");
				if (!chk) { 
					failStatus("Could not fetch chk value\nRefresh or navigate to another page");
					// document.location.href = "https://www.nationstates.net/page=un/template-overall=none";
				}

				makeRequest(
					"/page=UN_status", 
					`action=leave_UN&chk=${chk}&submit=1`, 
					resignCallback
				);

				break;

			// Go to sus
			case 'KeyB':
				updStatus(`Redirecting to ${JUMP_POINT}`);
				lockSimul();
				document.location.href = `https://www.nationstates.net/region=${JUMP_POINT}`;
				break;

			// Refresh
			case 'KeyA': 
				updStatus("Triggering refresh of page");
				lockSimul();
				window.location.reload();
				// No need to unlock, page will be reloaded
				break;

			// RO yourself
			case 'KeyD':
				if (!region) { 
					failStatus("Cannot detect current region");
					break;
				}

				updStatus(`ROing in ${region}`);

				var region_cache = localStorage.getItem("rgregioncache");
				if (region_cache) { 
					region_cache = JSON.parse(region_cache);

					// Cache invalid
					if (region_cache["region_name"] != region) { 
						// Cached region does not match current region
						warnStatus("ERROR: REGION CACHE INVALIDATED\nACTIVATING EMERGENCY SELF-RO");

						let RO_name = rotitle;
						// Tagging RO options
						makeRequest(
							`region=${region}`, 
							`page=region_control&region=${region}&chk=${chk}&nation=${nation}&office_name=${RO_name}&authority_A=on&authority_C=on&authority_E=on&authority_P=on&editofficer=1`, 
							ROCallback
						);

					} else { 
						// This is where the fun begins - smart dismissal
						// 1) Determine course of action
						// 2) Execute it
						// 3) Update cache

						// Not already an RO, and no room for new RO - we need to dismiss
						if (!region_cache["already_ro"] && region_cache["total_officers"] >= 12) { 
							// TODO: Select an RO that does NOT have successor permissions, and dismiss
							// If there is none, then ig we're fucked - alert the user and move on.
							// Otherwise, dismiss from officers and set total_officers = 0
							warnStatus("Too many officers, dismissing one");
							for (var i=0; i<region_cache["officers"].length; i++) { 
								var dismissal_target = region_cache["officers"][i];
								// RO without successor
								if (!dismissal_target["permissions"]["successor"]) { 
									// Remove that item from the officers list
									region_cache["officers"].splice(i, 1);
									let dismissal_nation = dismissal_target["nation"];
									let dismissal_office = dismissal_target["office"];

									updStatus(`Attempting to dismiss ${dismissal_nation}`);
									
									if (!dismissal_target["permissions"]["successor"]) { 
										makeRequest(
											`/page=region_control/region=${region}`, 
											`page=region_control&region=${region}&chk=${chk}&nation=${dismissal_nation}&office_name=${dismissal_office}&abolishofficer=1`, 
											dismissCallback
										).then((dismiss_success) => {
											// Check to see if RO succeeded, and update cache only if so
											console.log(dismiss_success);
											if (dismiss_success) { 
												console.log(`Dismissed ${dismissal_nation} successfully\n${region_cache["officers"].length} ROs remaining`);
												// We know there is room now - override the selection system
												region_cache["total_officers"] = 0;
												localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
											} else { 
												// Unlike any other RO attempt, here we assume that failure to dismiss is due to an issue with our permissions, 
												// rather than an issue with being able to dismiss this specific nation
												// This is because in this case, we are not an RO yet, and this could be because we are not delegate and thus could not, 
												// even if there was room
												// In other cases where we dismiss, we do so after becoming an RO ourselves, so we know we have executive powers, but
												// because 12 ROs will prevent us from doing this, we must assume the user pressing the key is more fallible than NS's
												// dismissal system. 
												// It is not a perfect solution, but a perfect one would involve me writing more javascript than the significant quantity
												// that I already have in pursuit of this project. For all practical applications, this approach suffices. This edge case
												// is extraordinarily rare in any event. 
												warnStatus(`Failed to dismiss ${dismissal_nation} - skipping\n${region_cache["officers"].length} ROs remaining`); // Todo - skip?
												//localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
											}
										});
										// We have made a request - now we exit the loop post-hate to prevent it from trying to make a second one
										break;
									}
								}
								// The one we looked at was a successor - move on to the next one
							}

							// If we reach this section, all the officers we could have dismissed have successor
							failStatus("All officers have successor status - cannot make room");

						} else if (region_cache["already_ro"] && region_cache["officers"].length == 0) { 
							// No more officers to deface, alert user to inability to continue
							failStatus("No more officers to dismiss");
						} else if (!region_cache["already_ro"]) { 
							// RO self
							updStatus(`ROing self in ${region}`);

							let RO_name = rotitle;
							// Tagging RO options
							makeRequest(
								`region=${region}`, 
								`page=region_control&region=${region}&chk=${chk}&nation=${nation}&office_name=${RO_name}&authority_A=on&authority_C=on&authority_E=on&authority_P=on&editofficer=1`, 
								ROCallback
							).then((RO_success) => {
								// Check to see if RO succeeded, and update cache only if so
								if (RO_success) { 
									console.log("Got response back - win!");
									region_cache["already_ro"] = true;
									localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
								} else { 
									console.error("Failed to RO");
								}
							});
						} else { 
							// Dismiss officers! Woo! Grab one off the stack lol
							let dismissal_target = region_cache["officers"].pop();
							let dismissal_nation = dismissal_target["nation"];
							let dismissal_office = dismissal_target["office"];

							updStatus(`Attempting to dismiss ${dismissal_nation}`);
							
							if (!dismissal_target["permissions"]["successor"]) { 
								makeRequest(
									`/page=region_control/region=${region}`, 
									`page=region_control&region=${region}&chk=${chk}&nation=${dismissal_nation}&office_name=${dismissal_office}&abolishofficer=1`, 
									dismissCallback
								).then((dismiss_success) => {
									// Check to see if RO succeeded, and update cache only if so
									console.log(dismiss_success);
									if (dismiss_success) { 
										console.log(`Dismissed ${dismissal_nation} successfully\n${region_cache["officers"].length} ROs remaining`);
										localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
									} else { 
										warnStatus(`Failed to dismiss ${dismissal_nation} - skipping\n${region_cache["officers"].length} ROs remaining`); // Todo - skip?
										localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
									}
								});
							} else { 
								// Make dismissal remove all perms but successor, and rename the office
								makeRequest(
									`/page=region_control/region=${region}`, 
									`page=region_control&region=${region}&chk=${chk}&nation=${dismissal_nation}&office_name=${suctitle}&authority_S=on&editofficer=1`, 
									successorCallback
								).then((dismiss_success) => {
									if (dismiss_success) { 
										console.log(`Dismissed ${dismissal_nation} successfully\n${region_cache["officers"].length} ROs remaining`);
										localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
									} else { 
										warnStatus(`Failed to dismiss ${dismissal_nation} - skipping\n${region_cache["officers"].length} ROs remaining`); // Todo - skip?
										localStorage.setItem("rgregioncache", JSON.stringify(region_cache));
									}
								});
							};
						}
						
					}

				// Cache missing
				} else { 
					// No cache found - emergency protocol, try to RO
					warnStatus("ERROR: COULD NOT ACQUIRE REGION CACHE\nACTIVATING EMERGENCY SELF-RO");

					let RO_name = rotitle;
					// Tagging RO options
					makeRequest(
						`region=${region}`, 
						`page=region_control&region=${region}&chk=${chk}&nation=${nation}&office_name=${RO_name}&authority_A=on&authority_C=on&authority_E=on&authority_P=on&editofficer=1`, 
						ROCallback
					);

				}

				break;

			// Move to region
			case 'KeyF':
				if (document.location.href.includes("region=")) { 
					var targetRegion = document.location.href.split("region=")[1];

					if (!region) {
						warnStatus("Cannot move to region you are already in");
						break;
					}


					updStatus(`Moving to region ${targetRegion}`);

					makeRequest(
						"/page=change_region",
						`localid=${localid}&region_name=${targetRegion}&move_region=1`, 
						moveCallback
					);

					break;

				} else { 
					warnStatus("Not looking at region");
				}

				break;

			// Endorse a nation
			case 'KeyS':
				if (!document.location.href.includes("nation=")) { 
					warnStatus("Must be on a nation page to endorse");
				} else { 
					let targetnation = document.getElementsByClassName("endorse")[0].form.children.nation.value ;
					makeRequest(
						"/cgi-bin/endorse.cgi", 
						`nation=${targetnation}&localid=${localid}&action=endorse`, 
						endorseCallback
					);
				}

				break;

			// Go to current region
			case 'KeyZ':
				updStatus(`Viewing ${region}`);
				lockSimul();
				document.location.href = `https://www.nationstates.net/region=${region}`;
				break;

			// Enable template=none
			case 'KeyT':
				if (!document.location.href.includes("template-overall=none")) { 
					updStatus(`Enabling template-overall=none`);
					lockSimul();
					document.location.href = `${document.location.href}/template-overall=none`;
				}
				break;
		}
	}
});
