var page_elements = document.getElementsByClassName("chatlog__message-group")
var selectionModeFlag = false
var loadedFlag = false;
var selected_images = {}
var selected_images_ordered = []
var userMediaCount = 0

var defaultPerPage = 15

function clientSidePagination(to){

	var perPage = document.getElementById("m").value
	var current = document.getElementById("p").value
	// allMediaCount
	
	var resultsPerPage = parseInt(perPage) || defaultPerPage
	var currentPage = parseInt(current) || 1
	
	var userFilter = document.getElementById("user-filter")	
	    userMediaCount = 0
	var filter = null
	
	if (userFilter.value && userFilter.value.trim()){

		filter = userFilter.value.trim().toLowerCase()
		
		for (var i = 0; i < page_elements.length; i++){
			if (page_elements[i].getAttribute("username").toLowerCase().startsWith(filter) ||
				page_elements[i].getAttribute("userID").toLowerCase().startsWith(filter) ||
				page_elements[i].getAttribute("nick").toLowerCase().startsWith(filter) ){

				userMediaCount++
			}
		}
	} else {
		userMediaCount = 0
	}
	
	var selectAllBtn = document.getElementById("select-all-btn")

	if ((Object.keys(selected_images).length == (userMediaCount||allMediaCount)) && loadedFlag){
		selectAllBtn.innerHTML = `unselect  (${userMediaCount||allMediaCount})`
	} else if (loadedFlag) {
		selectAllBtn.innerHTML = `select all (${userMediaCount||allMediaCount})`
	}

	
	var allPages = Math.ceil((filter ? userMediaCount : allMediaCount) / resultsPerPage )
	
	if (to == "first") currentPage = 1
	if (to == "last")  currentPage = allPages
	if (to == "next")  currentPage += 1
	if (to == "prev")  currentPage -= 1
	
	if (resultsPerPage < 1) resultsPerPage = defaultPerPage
	
	if (currentPage < 1) currentPage = 1
	if (currentPage > allPages) currentPage = allPages
	
	var startFrom = (currentPage-1) * resultsPerPage
	var endAt = (startFrom + resultsPerPage)-1
	
	var preload = document.getElementById("preload").checked

	if (filter){
		var counter = 0
		
		for (var i = 0; i < page_elements.length; i++){
			
			var el = page_elements[i]
			
			if (el.getAttribute("username").toLowerCase().startsWith(filter) ||
				el.getAttribute("userID").toLowerCase().startsWith(filter) ||
				el.getAttribute("nick").toLowerCase().startsWith(filter) ){

				if (counter >= startFrom && counter <= endAt){
					// show
					el.setAttribute("style", "")
					changeViewModeFor(el)
						
				} else if (preload && ( (counter >= startFrom-resultsPerPage)
								   &&	(counter <= endAt+resultsPerPage))){
									   
					// preload aka hide main div, but still set up the view mode/src
					el.setAttribute("style", "display: none;")
					changeViewModeFor(el)
					
				} else {
					// hide
					el.setAttribute("style", "display: none;")
					changeViewModeFor(el, 3)
				}
				counter++
			} else {
				// hide
				el.setAttribute("style", "display: none;")
				changeViewModeFor(el, 3)
			}
		}
	} else {
		for (var i = 0; i < page_elements.length; i++){
			
			var el = page_elements[i]
			
			if (i >= startFrom && i <= endAt){
				// show
				el.setAttribute("style", "")
				changeViewModeFor(el)
					
			} else if (preload && ( (i >= startFrom-resultsPerPage)
							   &&	(i <= endAt+resultsPerPage))){
				// preload aka hide main div, but still set up the view mode/src
				el.setAttribute("style", "display: none;")
				changeViewModeFor(el)
				
			} else {
				// hide
				el.setAttribute("style", "display: none;")
				changeViewModeFor(el, 3)
			}
		
		}
	}
	
	document.getElementById("m").value = resultsPerPage
	document.getElementById("p").value = currentPage
	
	handlePaginationButtons(currentPage, allPages)
	constructSelectionList()
}

function handlePaginationButtons(currentPage, allPages){

	if (currentPage == 1){
		document.getElementById("go-last").disabled = true
		document.getElementById("go-prev").disabled = true
		if (loadedFlag) document.getElementById("go-first").disabled = false
		document.getElementById("go-next").disabled = false
	} else if (currentPage == allPages){
		if (loadedFlag) document.getElementById("go-first").disabled = true
		document.getElementById("go-next").disabled = true
		document.getElementById("go-last").disabled = false
		document.getElementById("go-prev").disabled = false
	} else {
		document.getElementById("go-last").disabled = false
		document.getElementById("go-prev").disabled = false
		if (loadedFlag) document.getElementById("go-first").disabled = false
		document.getElementById("go-next").disabled = false
	}
	
	document.getElementById("current-page-display").innerHTML = `${currentPage} / ${allPages}`
}

function enableSelecting(val){
	
	selectionModeFlag = !selectionModeFlag;
	
	if (selectionModeFlag){
		document.getElementById("selection-buttons-container").setAttribute("style", "")
		//document.getElementById("select-all-page-btn").setAttribute("style", "")
		//document.getElementById("select-all-btn").setAttribute("style", "")
		document.getElementById("selection-mode-btn").setAttribute("style", "")
		document.getElementById("gallery-mode-btn").setAttribute("style", "display: none;")
		//document.getElementById("selection-mode-btn").innerHTML = "Selection mode"
		//document.getElementById("selection-mode-btn").className = "fancy-button-selection"
	} else {
		document.getElementById("selection-buttons-container").setAttribute("style", "display: none;")
		//document.getElementById("select-all-page-btn").setAttribute("style", "display: none;")
		//document.getElementById("select-all-btn").setAttribute("style", "display: none;")
		document.getElementById("gallery-mode-btn").setAttribute("style", "")
		document.getElementById("selection-mode-btn").setAttribute("style", "display: none;")
		//document.getElementById("selection-mode-btn").innerHTML = "Gallery mode"
		//document.getElementById("selection-mode-btn").className = "fancy-button-gallery"
	}
	
	for (var i = 0; i < page_elements.length; i++){
		
		var ignore = page_elements[i].getAttribute("style") == "display: none;"
		if (ignore) continue
		
		var el = page_elements[i].getElementsByClassName("img-link")[0]
		
		if (el.getAttribute("selectable") != "t"){
			el.setAttribute("selectable", "t")
			el.parentElement.getElementsByClassName("attachment-overlay-hover")[0].setAttribute("style", "")
			
			document.getElementById("selection-list").setAttribute("style", "")
		} else {
			el.setAttribute("selectable", "f")
			el.parentNode.getElementsByClassName("attachment-overlay-hover")[0].setAttribute("style", "display: none")
			el.parentElement.getElementsByClassName("attachment-overlay")[0].setAttribute("style", "display: none")
			selected_images = {}
			selected_images_ordered = []
			
			document.getElementById("selection-list").setAttribute("style", "display: none")
		}
	}
	
	constructSelectionList()
}

function selectAllOnPage(){

	if (!selectionModeFlag) return
	if (selected_images_ordered.length == allMediaCount) return
	
	for (var i = 0; i < page_elements.length; i++){
		
		var ignore = page_elements[i].getAttribute("style") == "display: none;"
		if (ignore) continue
		
		page_elements[i].getElementsByClassName("attachment-overlay")[0].setAttribute("style", "")
		
		var img = page_elements[i].getElementsByClassName("chatlog__attachment")[0]
		var alink = img.getElementsByClassName("img-link")[0]
		//var linkSplit = alink.href.split("/")
		//var linkEnd = `${linkSplit[linkSplit.length-1]}`
		
		addToSelection(page_elements[i].id, alink)
		
	}
	
	constructSelectionList()
}

function selectAll(){
	
	if (!selectionModeFlag || !loadedFlag) return
	
	if (Object.keys(selected_images).length == (userMediaCount||allMediaCount)){

		for (var i = 0; i < page_elements.length; i++){
			page_elements[i].getElementsByClassName("attachment-overlay")[0].setAttribute("style", "display: none")
		}
		selected_images = {}
		selected_images_ordered = []
		
	} else {
		
		var userFilter = document.getElementById("user-filter")	
		var filter = null
		
		if (userFilter.value && userFilter.value.trim()){

			filter = userFilter.value.trim().toLowerCase()
			
			for (var i = 0; i < page_elements.length; i++){
				if (page_elements[i].getAttribute("username").toLowerCase().startsWith(filter) ||
					page_elements[i].getAttribute("userID").toLowerCase().startsWith(filter) ||
					page_elements[i].getAttribute("nick").toLowerCase().startsWith(filter) ){

					page_elements[i].getElementsByClassName("attachment-overlay")[0].setAttribute("style", "")

					var alink = page_elements[i].getElementsByClassName("img-link")[0]
					//var linkSplit = alink.href.split("/")
					//var linkEnd = `${linkSplit[linkSplit.length-1]}`
					
					addToSelection(page_elements[i].id, alink)
				}
			}
			
		} else {
		
			for (var i = 0; i < page_elements.length; i++){
				//overlays[i].setAttribute("style", "")
				page_elements[i].getElementsByClassName("attachment-overlay")[0].setAttribute("style", "")

				var alink = page_elements[i].getElementsByClassName("img-link")[0]
				//var linkSplit = alink.href.split("/")
				//var linkEnd = `${linkSplit[linkSplit.length-1]}`
				
				addToSelection(page_elements[i].id, alink)
				
			}
		}
	}
	
	constructSelectionList()
	
}

function addToSelection(id, alink){

	if (selected_images[id]) return
	
	selected_images[id] = {
		//displayName: `(${page_elements[i].id}) ${linkEnd}`,
		filename: alink.getAttribute("fname"),
		url: alink.href
	}
	selected_images_ordered.push(id)
}

function selectImage(img){
	
	if (!selectionModeFlag) return
	
	var overlay = img.getElementsByClassName("attachment-overlay")[0]

	if (overlay.getAttribute("style") != "") {
		
		overlay.setAttribute("style", "")
		
		var alink = img.parentElement.getElementsByClassName("img-link")[0]
		//var linkSplit = alink.href.split("/")
		//var linkEnd = `${linkSplit[linkSplit.length-1]}`
		
		addToSelection(img.id, alink)
		
	} else {
		
		overlay.setAttribute("style", "display: none")
		
		if (selected_images[img.id]) delete selected_images[img.id]
		var index = selected_images_ordered.indexOf(img.id)
		if (index > -1) selected_images_ordered.splice(index, 1)
		
	}
	
	constructSelectionList()
}

function constructSelectionList(){
	var counter = 0
	
	var keys = selected_images_ordered
	var shownItems = 25
	
	
	document.getElementById("selection-list-header").innerHTML  = `<b>Selected ${keys.length} media:</b>`
	
	var selectionPreview = ""
	
	var startFrom = keys.length - shownItems < 0 ? 0 : keys.length - shownItems
	
	/*
		mode == 0 	=> show all
		mode == 1 	=> pictures only
		mode == 2 	=> video only
		mode == 3 	=> dont load anything
	*/
	
	var mode = document.getElementById("viewMode").value
	
	for (var i = startFrom; i < keys.length; i++){
		var url = selected_images[keys[i]].url
		var id = keys[i]
		
		selectionPreview += `<div class="sel-list-overlay" title="Remove"><div class="sel-preview-container" id="${id}" onclick="removeSel(this)">`
		
		if (url.includes('.mp4')){
			
			if (mode == 1 || mode == 3) {
				selectionPreview += `<img class="sel-preview" onerror="img404(this)" src="${picNoPreview}">`
			} else {
				selectionPreview += `
<video class="sel-preview" preload="metadata">
<source src="${url}" type="video/mp4" onerror="vid404(this)">
</video><img class="sel-preview" onerror="img404(this)" src="${pic404}" style="display:none;">`
			}
		} else if (url.includes('.webm')){
			if (mode == 1 || mode == 3) {
				selectionPreview += `<img class="sel-preview" onerror="img404(this)" src="${picNoPreview}>`
			} else {
				selectionPreview += `
<video class="sel-preview" preload="metadata">
<source src="${url}" type="video/webm" onerror="vid404(this)">
</video><img class="sel-preview" onerror="img404(this)" src="${pic404}" style="display:none;">`
			}
		} else {
			if (mode == 2 || mode == 3) {
				selectionPreview += `<img class="sel-preview" onerror="img404(this)" src="${picNoPreview}">`
			} else {
				selectionPreview += `<img class="sel-preview" onerror="img404(this)" src="${url}">`
			}
		}
		selectionPreview += '<div class="del-overlay"><div class="centered-text">Remove</div></div></div></div>'
	}
	
	if (keys.length == 0){
		document.getElementById("ps-download-button").disabled = true
	} else {
		document.getElementById("ps-download-button").disabled = false
	}
	document.getElementById("ps-download-button").innerHTML = `Download (${keys.length} files)`
	document.getElementById("selection-preview-list").innerHTML = selectionPreview
	
	if ((keys.length == (userMediaCount||allMediaCount)) && loadedFlag) {
		document.getElementById("select-all-btn").innerHTML = `unselect  (${userMediaCount||allMediaCount})`
	} else if (loadedFlag) {
		document.getElementById("select-all-btn").innerHTML = `select all (${userMediaCount||allMediaCount})`
	}
	
}

function removeSel(el){
	var id = el.getAttribute("id")
	
	var overlay = page_elements[id].getElementsByClassName("attachment-overlay")[0]
	overlay.setAttribute("style", "display: none")
	
	if (selected_images[id]) delete selected_images[id]
	var index = selected_images_ordered.indexOf(id)
	if (index > -1) selected_images_ordered.splice(index, 1)
	
	constructSelectionList()
}

var pic404 = "/images/loadfail.png"
var picNoPreview = "/images/nopreview.png"

function vid404(vid) {
    vid.onerror = ""
	vid.parentElement.nextElementSibling.setAttribute("style", "")
	vid.parentElement.remove()
}

function img404(img) {
    img.onerror = ""
    img.src = pic404
}

function goToMainpage(){
	window.location.href = '/';
}

function discordAuth(){
	//window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=675458545809883149&redirect_uri=http%3A%2F%2F172.245.52.56%3A5001%2Fbrowse&response_type=code&scope=identify%20guilds'
	window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=675458545809883149&redirect_uri=http%3A%2F%2Flocalhost%3A5001%2Fbrowse&response_type=code&scope=identify%20guilds';
}

function goToServerPage(){
	var id = document.getElementById("server-id-input")
	
	if (id.value == "") return
	
	window.location.href = `/browse/${id.value}`;
}


function PowerShell_downloadScript(){
	
	if (selected_images_ordered.length == 0) {
		alert("no media selected")
		return
	}
	
	showVisualGuide()
	
	var res = PowerShell_generateScript()
	startDownload(res.filename, res.content)
	
	//generateZIPfile(res.filename)
	
}

/*
async function generateZIPfile(filename){

	var zip = new JSZip()
	var keys = selected_images_ordered

	for (let i = 0; i < keys.length; i++){
		var k = selected_images[keys[i]]
		
		try {
			
			const searchRegExp = /\//g;
			const replaceWith = '-_-_-_-';

			const result = k.url.replace(searchRegExp, replaceWith);
			
			var res = await fetch(`/blob-proxy/${result}`)
			
			zip.folder(filename.replace(".ps1","")).file(k.filename, res.blob())
			
			console.log(`progress: ${(i*100)/keys.length}%`)
			
		} catch (e){
			
		}
	}
	
	var base64
	var el
	
	try {
		base64 = await zip.generateAsync({type:"base64"})
		el = document.createElement('a')
	} catch (e){
		alert("shit gone wrong " + e)
	}
	
	el.setAttribute('href', "data:application/zip;base64," + base64)
	el.setAttribute('download', filename.replace(".ps1",".zip"))
	
	el.style.display = 'none'
	document.body.appendChild(el)
	el.click()
	document.body.removeChild(el)
}
*/


function startDownload(filename, text) {
	
	var el = document.createElement('a')
	el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
	el.setAttribute('download', filename)

	el.style.display = 'none'
	document.body.appendChild(el)
	el.click()
	document.body.removeChild(el)
	
}

function PowerShell_generateScript(){
	
    var psTail = document.getElementById("psTail")
	
	var keys = Object.keys(selected_images) // .reverse()
	
	let head = "$data = @("

	for (let i = 0; i < keys.length; i++){
		var imgData = selected_images[keys[i]]
		head +=	`\n  [PSCustomObject]@{\n    Url = "${imgData.url}"\n    Filename = "${imgData.filename}"\n  }`
		if (i != (keys.length - 1)) head += ","
	}

	head += "\n)\n\n"
	
	return {
		filename: `${psTail.getAttribute("chname")}-${keys.length}-dl.ps1`,
		content: head + psTail.innerHTML.replace("&gt;&gt;",">>")
	}
	
}

function showVisualGuide(){
	document.getElementById("visual-guide-popup").setAttribute("style", "")
}

function hide(el){
	el.setAttribute("style", "display:none;")
}

function fixPaginationButtons(){
	loadedFlag = true;
	document.getElementById("go-first").innerHTML = "Newest"
	document.getElementById("go-first").disabled = false
	
	document.getElementById("select-all-btn").innerHTML = `select all (${userMediaCount||allMediaCount})`
	document.getElementById("select-all-btn").disabled = false
}

function initPageValues(){
	var allPages = Math.ceil(allMediaCount / defaultPerPage)
	document.getElementById("current-page-display").innerHTML = `1 / ${allPages}`
}

function filterByClicked(o) {

	var userFilter = document.getElementById("user-filter")	
	//var userID = document.getElementById(name).getAttribute("userID")
	var userID = o.getAttribute("userID")
	
	userFilter.value = userID
	userFilter.onchange();
	//clientSidePagination()
}

function clearFilter(){
	var userFilter = document.getElementById("user-filter")	
	userFilter.value = ""
	userFilter.onchange();
}

function changeViewModeFor(item, a){
	
	var mode = a ? a : document.getElementById("viewMode").value
	
	var image = item.getElementsByClassName("chatlog__attachment-image")[0]
	var video = item.getElementsByClassName("chatlog__attachment-video")[0]
	
	// we will handle scaling in here too 
	var scale_val = document.getElementById("mediaScaler").value
	var el = item.getElementsByClassName("img-link")[0]
	
	if (selectionModeFlag) {
		
		if (el.getAttribute("selectable") != "t"){
			el.setAttribute("selectable", "t")
			el.parentElement.getElementsByClassName("attachment-overlay-hover")[0].setAttribute("style", "")
			
			document.getElementById("selection-list").setAttribute("style", "")
		}
		
	} else {
		
		if (el.getAttribute("selectable") != "f"){
			el.setAttribute("selectable", "f")
			el.parentNode.getElementsByClassName("attachment-overlay-hover")[0].setAttribute("style", "display: none")
			el.parentElement.getElementsByClassName("attachment-overlay")[0].setAttribute("style", "display: none")
			
			document.getElementById("selection-list").setAttribute("style", "display: none")
		}
		
	}
	
	/*
		mode == 0 	=> show all
		mode == 1 	=> pictures only
		mode == 2 	=> video only
		mode == 3 	=> dont load anything
	*/
	
	if (image){
		image.style.maxWidth = scale_val + "px"
		
		if (mode == 0 || mode == 1){
			image.setAttribute("src", image.getAttribute("hiddenurl"))
		} else if (mode == 2 || mode == 3){
			image.setAttribute("src", "")
		}
		
	} else if (video){
		video.parentNode.style.maxWidth = scale_val + "px"
		
		if (mode == 0 || mode == 2){
			video.setAttribute("src", video.getAttribute("hiddenurl"))
			video.parentNode.setAttribute("height", "")
			video.parentNode.load()
			
		} else if (mode == 1 || mode == 3){
			video.setAttribute("src", "")
			video.parentNode.setAttribute("height", 0)
			video.parentNode.load()
		}
	}
	
}

function scaleMedia(val){
	
	var perPage = document.getElementById("m").value
	var current = document.getElementById("p").value
	// allMediaCount
	
	var resultsPerPage = parseInt(perPage) || defaultPerPage
	var currentPage = parseInt(current) || 1
	
	var allPages = Math.ceil(allMediaCount / perPage)
	
	if (resultsPerPage < 0) resultsPerPage = defaultPerPage
	
	if (currentPage < 1) currentPage = 1
	if (currentPage > allPages) currentPage = allPages
	
	var startFrom = (currentPage-1) * resultsPerPage
	var endAt = (startFrom + resultsPerPage)-1
	
	for (var i = 0; i < page_elements.length; i++){
		
		var ignore = page_elements[i].getAttribute("style") == "display: none;"
		if (ignore) continue
		
		var image = page_elements[i].getElementsByClassName("chatlog__attachment-image")[0]
		var video = page_elements[i].getElementsByClassName("chatlog__attachment-video")[0]
		
		if (image){
			image.style.maxWidth = val + "px"
		} else if (video){
			video.parentNode.style.maxWidth = val + "px"
		}
		
	}
	
	/*
	for (var i = startFrom; i <= endAt; i++){
		var image = page_elements[i].getElementsByClassName("chatlog__attachment-image")[0]
		var video = page_elements[i].getElementsByClassName("chatlog__attachment-video")[0]
		
		if (image){
			image.style.maxWidth = val + "px"
		} else if (video){
			video.parentNode.style.maxWidth = val + "px"
		}
	}
	*/
	
}

function numbersOnly(input){
	
	var numOnly = parseInt(input.value)
	
	var mVal = parseInt(document.getElementById("m").value) || defaultPerPage
	var pVal = parseInt(document.getElementById("p").value) || 1
	
	var allPages = Math.ceil(allMediaCount / mVal)
	
	if (isNaN(numOnly) || numOnly < 0) numOnly = 0
	
	if (input.id == "m"){
		if (numOnly > allMediaCount) numOnly = allMediaCount
		if (numOnly > (allMediaCount/pVal)) document.getElementById("p").value = Math.ceil(allMediaCount/mVal)
	} 
	
	if (input.id == "p" && numOnly > allPages) numOnly = allPages
	
	input.value = numOnly
	
}
