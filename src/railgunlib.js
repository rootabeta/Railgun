// Helper function to extract values from page easily
function some(name) { 
	if (document.getElementsByName(name).length > 0) { 
		return document.getElementsByName(name)[0].value;
	} else { 
		return null;
	}
}

function grab(name) { 
        if (document.getElementById(name)) {
                return document.getElementById(name);
        } else { 
                return null;
        }
}

