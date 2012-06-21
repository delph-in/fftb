var svg = element("svg");
svg.setAttribute("version", "1.1");
document.getElementById("disc-scroller").appendChild(svg);
svg.style.background = "white";

//var containerTag = "svg";	// results in sloooow rendering
var containerTag = "g";	// results in fast rendering!

function element(type)
{
	return document.createElementNS("http://www.w3.org/2000/svg", type);
}

function container()
{
	var g = element(containerTag);
	for(var x=0;arguments.length>x;x=x+1) { g.appendChild(arguments[x]); }
	return g;
}

function line(x1,y1,x2,y2)
{
	var l = element("line");
	l.setAttributeNS(null, "x1", x1);
	l.setAttributeNS(null, "x2", x2);
	l.setAttributeNS(null, "y1", y1);
	l.setAttributeNS(null, "y2", y2);
	l.setAttributeNS(null, "style", "stroke: black;");
	return l;
}

function text(str)
{
	var t = element("text");
	t.appendChild(document.createTextNode(str));
	svg.appendChild(t);
	var bbx = t.getBBox();
	svg.removeChild(t);
	t.bbx = bbx;
	return t;
}

DAUGHTER_HSPACE=10
DAUGHTER_VSPACE=20

function render_yield(str)
{
	var y = text(str);
	y.setAttributeNS(null, "y", y.bbx.height * 2/3);
	y.setAttributeNS(null, "style", "fill: red;");
	var g = element(containerTag);
	g.appendChild(y);
	g.mywidth = y.bbx.width;
	return g;
}

function render_tree(t)
{
	var	dtrs = [];
	var wtot = -DAUGHTER_HSPACE;
	var dtr_label_mean = 0;
	for(var x in t.daughters)
	{
		wtot += DAUGHTER_HSPACE;
		dtrs[x] = render_tree(t.daughters[x]);
		dtr_label_mean += wtot + dtrs[x].labelcenter;
		wtot += dtrs[x].mywidth;
	}
	var lexical;
	if(dtrs.length)
	{
		dtr_label_mean /= dtrs.length;
	}
	else
	{
		lexical = render_yield(getYield(t.from, t.to));
		wtot = lexical.mywidth;
		dtr_label_mean = wtot / 2;
	}
	var dtrs_wtot = wtot;

	var g = element(containerTag);
	var n = text(t.shortlabel);
	var nw = n.width;
	var nh = n.height;
	nw = n.bbx.width;
	nh = n.bbx.height;
	var labelcenter = dtr_label_mean;
	if(labelcenter - nw/2 < 0)labelcenter = nw/2;
	if(labelcenter + nw/2 > wtot)labelcenter = wtot - nw/2;
	if(nw > wtot) { wtot = nw; labelcenter = wtot / 2; }
	n.setAttributeNS(null, "x", labelcenter - nw / 2);
	n.setAttributeNS(null, "y", nh * 2/3);
	g.appendChild(n);
	var	dtr_x = wtot / 2 - dtrs_wtot / 2;
	var ytrans = nh + DAUGHTER_VSPACE;
	for(var x in dtrs)
	{
		dtrs[x].setAttributeNS(null, "transform", "translate(" + dtr_x + "," + ytrans + ")");
		g.appendChild(line(labelcenter, nh, dtr_x + dtrs[x].labelcenter, nh + DAUGHTER_VSPACE - 1));
		g.appendChild(dtrs[x]);
		dtr_x += dtrs[x].mywidth + DAUGHTER_HSPACE;
	}
	if(lexical)
	{
		lexical.setAttributeNS(null, "transform", "translate(" + dtr_x + "," + ytrans + ")");
		g.appendChild(line(labelcenter, nh, wtot/2, nh + DAUGHTER_VSPACE - 1));
		g.appendChild(lexical);
	}
	g.mywidth = wtot;
	g.labelcenter = labelcenter;
	g.labelheight = nh;
	t.mainsvg = g;
	t.labelsvg = n;

	return g;
}

function stop_popups()
{
	popup_to_stop.setAttributeNS(null, "style", "visibility: hidden;");
	popup_to_stop = null;
}

function render_tree_popups(t, isleft, isright, istop)
{
	var dtrs_wtot = -DAUGHTER_HSPACE;
	var	dtrs = [];
	for(var x in t.daughters)
	{
		dtrs[x] = render_tree_popups(t.daughters[x], (x>0)?0:isleft, (x<(t.daughters.length-1))?0:isright, 0);
		dtrs_wtot += t.daughters[x].mainsvg.mywidth + DAUGHTER_HSPACE;
	}

	var maing = t.mainsvg;
	var labelheight = maing.labelheight;
	var labelcenter = maing.labelcenter;
	var wtot = maing.mywidth;

	var g = element(containerTag);
	g.setAttributeNS(null, "width", wtot);

	var	dtr_x = wtot / 2 - dtrs_wtot / 2;
	var ytrans = labelheight + DAUGHTER_VSPACE;
	for(var x in dtrs)
	{
		dtrs[x].setAttributeNS(null, "transform", "translate(" + dtr_x + "," + ytrans + ")");
		dtr_x += dtrs[x].mywidth + DAUGHTER_HSPACE;
		g.appendChild(dtrs[x]);
	}


	var altlabel = text(t.label);
	var altwidth = altlabel.bbx.width;
	var altheight = altlabel.bbx.height;
	var boxwidth = altwidth + 10;
	var boxheight = altheight + 10;

	var bg = element("rect");
	bg.setAttributeNS(null, "style", "fill: white; stroke: black; stroke-width: 2px;");
	bg.setAttributeNS(null, "width", boxwidth);
	bg.setAttributeNS(null, "height", boxheight);
	altlabel.setAttributeNS(null, "x", 5);
	altlabel.setAttributeNS(null, "y", boxheight - 5 - 5);

	var galt = container(bg, altlabel);
	var galtx = (labelcenter - boxwidth/2);
	var galty = -5;
	if(isleft && galtx<1)galtx = 1;
	if(isright && galtx + boxwidth > wtot-1)galtx = wtot-1 - boxwidth;
	if(istop)galty = 1;
	galt.setAttributeNS(null, "transform", "translate(" + galtx + "," + galty + ")");
	galt.setAttributeNS(null, "style", "visibility: hidden;");
	g.appendChild(galt);

	g.mywidth = wtot;

	t.labelsvg.onmouseover = function() { galt.setAttributeNS(null, "style", "visibility: visible;"); popup_to_stop = galt; }
	galt.onmouseout = stop_popups;//function() { stop_popups(); }

	return g;
}

function show_trees()
{
	var total_h = 0;
	var max_w = 0;
	while(svg.firstChild)svg.removeChild(svg.firstChild);

	var availWidth = 400, availHeight = 400;

	if(message.trees.length > 0)
	{
		var host = document.getElementById("disc-scroller");
		host.appendChild(svg);
		availWidth = host.clientWidth - 18;
		availHeight = host.clientHeight - 18;
	}
	else
	{
		if(svg.parentNode)svg.parentNode.removeChild(svg);
		if(message.error)
		{
			document.getElementById("disc-scroller").appendChild(document.createTextNode(message.error));
		}
	}

	var myg = element("g");
	svg.appendChild(myg);

	//for(var x in message.trees)
	if(message.trees.length > 0)
	{
	x = 0
	{
		var	t = render_tree(message.trees[x]);
		t.setAttribute("y", total_h);
		var	popt = render_tree_popups(message.trees[x], 1, 1, 1);
		popt.setAttribute("y", total_h);
		myg.appendChild(t);
		myg.appendChild(popt);
		var b = t.getBBox();
		total_h += b.height;
		if(b.width > max_w)max_w = b.width;
	}
	}

	var scale = availWidth / max_w;
	if(availHeight / total_h < scale)scale = availHeight / total_h;
	if(scale > 1.0)scale = 1.0;
	myg.setAttribute("transform", "scale("+scale+")");
	//svg.style.width = availWidth + "px";
	//svg.style.height = availHeight + "px";
	//svg.setAttribute("style", "width: " + availWidth + "px; height: " + availHeight + "px;");
	svg.setAttribute("width", max_w);
	svg.setAttribute("height", total_h);

	var ds = document.getElementById("disc-scroller");
	var ov = document.getElementById("overlay");

	svg.onclick = function()
	{
		if(svg.parentNode == ds)
		{
			ov.appendChild(svg);
			ov.style.display = "block";
			myg.setAttribute("transform", "scale(1)");
		}
		else
		{
			ds.appendChild(svg);
			ov.style.display = "none";
			myg.setAttribute("transform", "scale("+scale+")");
		}
		stop_popups();
	}

	var html = message.ntrees + " remaining.";
	if(message.oldgold)
		html += " Gold tree is " + (message.oldgold.in?"in":"out") + ".";
	document.getElementById("counters").innerHTML = html;
}

var hilight_set = [];
var	first_hi;

function dehilight()
{
	for(var x=0;x<hilight_set.length;x++)
		hilight_set[x].style.color = hilight_set[x].defaultColor;
	hilight_set = [];
}

function hilight(x)
{
	dehilight();
	if(x.tokFrom >= first_hi.tokTo)
	{
		var w;
		for(w = first_hi;w!=x.nextSibling && w;w=w.nextSibling)
		{
			w.style.color = "red";
			hilight_set.push(w);
		}
		for(w = x.nextSibling;w && bars[w.tokFrom * 2];w = w.nextSibling)
		{
			w.style.color = "red";
			hilight_set.push(w);
		}
		for(w = first_hi.previousSibling;w && bars[w.tokTo * 2];w = w.previousSibling)
		{
			w.style.color = "red";
			hilight_set.push(w);
		}
	}
	else
	{
		var w;
		for(w = x;w && w!=first_hi.nextSibling;w=w.nextSibling)
		{
			w.style.color = "red";
			hilight_set.push(w);
		}
		for(w = first_hi.nextSibling;w && bars[w.tokFrom * 2];w = w.nextSibling)
		{
			w.style.color = "red";
			hilight_set.push(w);
		}
		for(w = x.previousSibling;w && bars[w.tokTo * 2];w = w.previousSibling)
		{
			w.style.color = "red";
			hilight_set.push(w);
		}
	}
}

function cancel_hilight()
{
	if(first_hi)
	{
		dehilight();
		first_hi = null;
	}
}

function no_hilight()
{
	dehilight();
	first_hi = null;
	dspan = "";
	dspanfrom = dspanto = null;
	refilter();
}

function begin_hilight_words(x)
{
	dehilight();
	first_hi = x;
	hilight(x);
}

function drag_hilight_words(x)
{
	if(first_hi)
		hilight(x);
}

var dspanto;
var dspanfrom;
var dspan = "";

function end_hilight_words(x)
{
	var from = 9999, to = 0;
	first_hi = null;
	for(var x in hilight_set)
	{
		var wf = hilight_set[x].tokFrom;
		var wt = hilight_set[x].tokTo;
		if(wf<from)from=wf;
		if(wt>to)to=wt;
	}
	//alert("words " +from+ " to " +to+ " inclusive.");
	if(from != to)
	{
		//decisions.push({type:"span",from:from,to:to});
		dspan = from + ":" + to;
		dspanfrom = from;
		dspanto = to;
		refilter();
	}
	else dehilight();
}

function hilight_dec(from, to)
{
	var sentence = document.getElementById("sentence");
	for(var x in sentence.childNodes)
	{
		var n = sentence.childNodes[x];
		if(n.tokFrom == n.tokTo && from != to)
		{
			// skip the spaces on the ends of the span
			if(n.tokFrom == from || n.tokFrom == to)
				continue;
		}
		if(n.tokFrom >= from && n.tokTo <= to)
			n.style.background = 'lightgreen';
	}
}

function unhilight_dec()
{
	var sentence = document.getElementById("sentence");
	for(var x in sentence.childNodes)
	{
		var n = sentence.childNodes[x];
		if(n.style)n.style.background = 'none';
	}
}

var showing_spacetext = 0;
function hide_spacetext()
{
	var sentence = document.getElementById("sentence");
	for(var x in sentence.childNodes)
	{
		var n = sentence.childNodes[x];
		if(n.spacespan)
			n.spacespan.innerHTML = "&nbsp;";
	}
	document.getElementById("st-hide").style.display="inline";
	document.getElementById("st-show").style.display="none";
	showing_spacetext = 0;
}

function show_spacetext()
{
	var sentence = document.getElementById("sentence");
	for(var x in sentence.childNodes)
	{
		var n = sentence.childNodes[x];
		if(n.spacespan)
			n.spacespan.innerHTML = n.spacetext;
	}
	document.getElementById("st-hide").style.display="none";
	document.getElementById("st-show").style.display="inline";
	showing_spacetext = 1;
}

function find_token_vertices(tokens)
{
	var verts = [];
	for(var x in tokens)
	{
		var t = tokens[x];
		if(!verts[t.from])verts[t.from] = {left:t.cfrom, right:t.cfrom};
		else verts[t.from].right = t.cfrom;
		if(!verts[t.to])verts[t.to] = {left:t.cto, right:t.cto};
		else verts[t.to].left = t.cto;
	}
	verts = verts.sort(function(x,y) { return x.left - y.left; });
	if(!verts.length)return [];
	verts[0].left = 0;
	verts[verts.length-1].right = message.item.length;
	for(var x in verts)
	{
		var word = message.item.substring(verts[x].left, verts[x].right);
		verts[x].text = word;
		verts[x].id = parseInt(x);
	}
	return verts;
}

function renderable_span(text, from, to, has_bar, is_space)
{
	var d = document.createElement("div");
	d.defaultColor = is_space?"#aaa":"black";
	d.style.cssFloat = "left";
	d.style.margin = "0px 0px 0px 0px";
	d.style.color = d.defaultColor;
	var t = document.createElement("table");
	d.appendChild(t);
	var b = document.createElement("tbody");
	t.style.margin = "0px 0px 0px 0px";
	t.style.padding = "0px 0px 0px 0px";
	t.style.borderCollapse = "collapse";
	t.style.border = "none";
	t.appendChild(b);

	// text row
	var r = document.createElement("tr");
	b.appendChild(r);
	var cell = document.createElement("td");
	r.appendChild(cell);
	//cell.appendChild(document.createTextNode(text));
	var span = document.createElement("span");
	if(is_space)
	{
		d.spacespan = span;
		d.spacetext = text;
		span.innerHTML = showing_spacetext?text:"&nbsp;";
	}
	else span.innerHTML = text;
	cell.appendChild(span);

	// green bar row
	r = document.createElement("tr");
	b.appendChild(r);
	cell = document.createElement("td");
	cell.style.background = has_bar?"green":"none";
	//cell.style.paddingLeft = "5px";
	r.appendChild(cell);

	d.tokFrom = from;
	d.tokTo = to;

	if(dspanto)
	{
		var hit = 0;
		if(d.tokFrom >= dspanfrom && d.tokTo <= dspanto &&
			!(is_space && ((d.tokFrom == dspanfrom && d.tokTo == dspanfrom) || (d.tokFrom == dspanto && d.tokTo == dspanto))))
		{
			hilight_set.push(d);
			d.style.color = "red";
			hit = 1;
		}
	}
	var mobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));  
	if(mobile)
	{
		d.addEventListener("touchstart", function(x){return function(ev){ev.preventDefault();begin_hilight_words(x);}}(d), false);
		d.addEventListener("touchmove", function(ev){
			var x=document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY);
			while(x && x.nodeName.toLowerCase() != "div")x = x.parentNode;
			ev.preventDefault();if(x)drag_hilight_words(x);
			}, false);
		d.addEventListener("touchend", function(x){return function(ev){ev.preventDefault();end_hilight_words(x);}}(d), false);
	}
	else
	{
		d.onmousedown = function(x){return function(ev){ev.preventDefault();begin_hilight_words(x);if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d);
		d.onmousemove = function(x){return function(ev){ev.preventDefault();drag_hilight_words(x);if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d);
		d.addEventListener("mouseup", function(x){return function(ev){ev.preventDefault();end_hilight_words(x);if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d), false);
	}
	d.addEventListener("click", function(x){return function(ev){ev.preventDefault();if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d), false);

	document.getElementById("st-hide").addEventListener("click", function(x){return function(ev){ev.preventDefault();if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;show_spacetext();}}(d), false);
	document.getElementById("st-show").addEventListener("click", function(x){return function(ev){ev.preventDefault();if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;hide_spacetext();}}(d), false);

	return d;
}

function show_sentence()
{
	//var words = message.item.split(" ");
	var tokens = message.tokens.sort(
		function(x,y) { return x.from - y.from; } );
	var chunks = message.chunks;
	var sentence = document.getElementById("sentence");

	hilight_set = [];

	var ci = 0;
	bars = [];
	for(var c in chunks)
	{
		for(var i=chunks[c].from;i<chunks[c].to;i=i+1)
		{
			bars[i] = chunks[c].state;
		}
	}

	while(sentence.firstChild)sentence.removeChild(sentence.firstChild);

	var vertices = find_token_vertices(message.tokens);
	message.vertices = vertices;
	var last_vert = null;
	var B = 0;
	for(var x in vertices)
	{
		var vert = vertices[x];
		if(last_vert)
		{
			var word = message.item.substring(last_vert.right, vert.left);
			sentence.appendChild(renderable_span(word, last_vert.id, vert.id, bars[B++], 0));
		}
		last_vert = vert;
		//sentence.appendChild(renderable_span(vert.text + "&nbsp;", vert.id, vert.id, bars[B++], 1));
		var sptext = vert.text.replace(/ /,"&nbsp;");
		if(sptext=="")sptext="&nbsp;";	// need something there or the greenline will go in the wrong place...
		sentence.appendChild(renderable_span(sptext, vert.id, vert.id, bars[B++], 1));
	}

	/*sentence.appendChild(document.createElement("br"));
	sentence.appendChild(document.createElement("br"));

	for(var x in tokens)
	{
		var d = document.createElement("div");
		d.style.cssFloat = "left";
		d.style.margin = "0px 0px 0px 0px";
		var t = document.createElement("table");
		d.appendChild(t);
		var b = document.createElement("tbody");
		t.style.margin = "0px 0px 0px 0px";
		t.style.padding = "0px 0px 0px 0px";
		t.style.borderCollapse = "collapse";
		t.style.border = "none";
		t.appendChild(b);
		sentence.appendChild(d);

		// text row
		var r = document.createElement("tr");
		b.appendChild(r);
		var cell = document.createElement("td");
		r.appendChild(cell);
		var cell = document.createElement("td");
		r.appendChild(cell);
		cell.appendChild(document.createTextNode(tokens[x].text));

		// green bar row
		r = document.createElement("tr");
		b.appendChild(r);
		cell = document.createElement("td");
		B = bars[ci]; ci = ci+1;
		cell.style.background = B?"green":"none";
		cell.style.paddingLeft = "5px";
		r.appendChild(cell);
		cell = document.createElement("td");
		B = bars[ci]; ci = ci+1;
		cell.style.background = B?"green":"none";
		r.appendChild(cell);

		d.tokFrom = tokens[x].from;
		d.tokTo = tokens[x].to;
		tokens[x].div = d;
		if(dspanto)
		{
			if(d.tokFrom >= dspanfrom && d.tokTo <= dspanto)
			{
				hilight_set.push(d);
				d.style.color = "red";
			}
		}
		var mobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));  
		if(mobile)
		{
			d.addEventListener("touchstart", function(x){return function(ev){ev.preventDefault();begin_hilight_words(x);}}(d), false);
			d.addEventListener("touchmove", function(ev){
				var x=document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY);
				while(x && x.nodeName.toLowerCase() != "div")x = x.parentNode;
				ev.preventDefault();if(x)drag_hilight_words(x);
				}, false);
			d.addEventListener("touchend", function(x){return function(ev){ev.preventDefault();end_hilight_words(x);}}(d), false);
		}
		else
		{
			d.onmousedown = function(x){return function(ev){ev.preventDefault();begin_hilight_words(x);if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d);
			d.onmousemove = function(x){return function(ev){ev.preventDefault();drag_hilight_words(x);if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d);
			d.addEventListener("mouseup", function(x){return function(ev){ev.preventDefault();end_hilight_words(x);if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d), false);
		}
		d.addEventListener("click", function(x){return function(ev){ev.preventDefault();if(ev.stopPropagaton)ev.stopPropagation(); else ev.cancelBubble = true;}}(d), false);
	}*/
	window.onmouseup = cancel_hilight;
	document.getElementById("yellow").onclick = no_hilight;
}

function enable_all_old()
{
	for(var x in message.olddec)
		use_old_decs[x] = true;
	document.getElementById('old-on').style.display = 'inline';
	document.getElementById('old-off').style.display = 'none';
	document.getElementById('old-some').style.display = 'none';
	refilter();
}

function disable_all_old()
{
	for(var x in message.olddec)
		use_old_decs[x] = null;
	document.getElementById('old-off').style.display = 'inline';
	document.getElementById('old-on').style.display = 'none';
	document.getElementById('old-some').style.display = 'none';
	refilter();
}

function show_old()
{
	document.getElementById('old-decisions-list').style.display = 'block';
	document.getElementById('old-show').style.display = 'inline';
	document.getElementById('old-hide').style.display = 'none';
}

function hide_old()
{
	document.getElementById('old-decisions-list').style.display = 'none';
	document.getElementById('old-show').style.display = 'none';
	document.getElementById('old-hide').style.display = 'inline';
}

function nixdecision(x)
{
	decisions.splice(x,1);
	refilter();
}

function nixolddecision(x)
{
	use_old_decs[x] = !use_old_decs[x];
	document.getElementById('old-off').style.display = 'none';
	document.getElementById('old-on').style.display = 'none';
	document.getElementById('old-some').style.display = 'inline';
	var allon = true, alloff = true;
	for(var i in message.olddec)
	{
		if(use_old_decs[i])alloff = false;
		if(!use_old_decs[i])allon = false;
	}
	if(allon)return enable_all_old();
	if(alloff)return disable_all_old();
	refilter();
}

function show_decisions()
{
	var d = document.getElementById("new-decisions-list");
	d.innerHTML = "";
	document.getElementById("new-d-count").innerHTML = decisions.length;
	for(var x in decisions)
	{
		var dec = decisions[x];
		var nixer = " <a href='javascript:nixdecision(" + x + ");'>[x]</a>";
		d.innerHTML += "<span onmouseover='hilight_dec("+dec.from+","+dec.to+")' onmouseout='unhilight_dec()'>" + dec.type + ": " + dec.from + " to " + dec.to + nixer + "</span><br/>";
	}
	if(message.olddec)
	{
		document.getElementById("old-d-count").innerHTML = message.olddec.length;
		document.getElementById("old-decisions").style.display = "block";
		var od = message.olddec;
		d = document.getElementById("old-decisions-list");
		d.innerHTML = "";
		for(var inferred in [0,1])
		{
			if(inferred == 0)d.innerHTML += "<b>Manual:</b><br/>";
			if(inferred == 1)d.innerHTML += "<b>Inferred:</b><br/>";
			for(var x in od)
			{
				var fields = od[x].split(":");
				if(fields[3] != inferred)continue;
				var nixer = "";
				var link = "<a href='javascript:nixolddecision(" + x + ");'>";
				if(use_old_decs[x])
					nixer = " [on|" + link + "off</a>]";
				else nixer = " [" + link + "on</a>|off]";
				var span = fields[2].split("-");
				var from = span[0], to = span[1];
				var txt = fields[0] + ": " + from + " to " + to + " / " + fields[1];
				d.innerHTML += "<span onmouseover='hilight_dec("+from+","+to+")' onmouseout='unhilight_dec()'>" + txt.toLowerCase() + nixer + "</span><br/>";
			}
		}
	}
}

function select_discriminant(d)
{
	decisions.push({type:d.sign,from:d.from,to:d.to});
	refilter();
}

function open_window(url)
{
	window.open(url, '_blank');
}

function open_lextype_docs(event, lextype)
{
	if(event.shiftKey)
	{
		if(event.stopPropagation)event.stopPropagation();
		else event.cancelBubble = true;
		event.preventDefault();
		return open_window("http://lingo.stanford.edu/~danf/cgi-bin/ERG_1010/description.cgi?type=" + lextype);
	}
}

function open_rule_docs(event, rule)
{
	if(event.shiftKey)
	{
		if(event.stopPropagation)event.stopPropagation();
		else event.cancelBubble = true;
		event.preventDefault();
		return open_window("http://moin.delph-in.net/ErgRules");
	}
}

function buildUnaryChain(sign)
{
	var d = document.createElement("div");
	var signs = sign.split("@");
	var first = 1;
	for(var x in signs)
	{
		if(!first)
		{
			var n = document.createElement("div");
			n.appendChild(document.createTextNode("|"));
			d.appendChild(n);
		}
		first = 0;
		var n = document.createElement("div");
		n.appendChild(document.createTextNode(signs[x]));
		if(signs[x].substring(signs[x].length-3) == "_le")
			n.onclick = function(s) { return function(ev)
				{ open_lextype_docs(ev, s); }; }(signs[x]);
		else n.onclick = function(s) { return function(ev)
				{ open_rule_docs(ev, s); }; }(signs[x]);
		d.appendChild(n);
	}
	return d;
}

function getYield(from, to)
{
	var str = "";
	var cfrom = message.vertices[from].right;
	var cto = message.vertices[to].left;
	return message.item.substring(cfrom, cto);

	var tokens = message.tokens.sort(
		function(x,y) { return x.from - y.from; } );
	for(var x in tokens)
	{
		var t = tokens[x];
		if(t.from >= from && t.to <= to)
		{
			if(str != "")
				str = str + " ";
			str = str + t.text;
		}
	}
	return str;
}

function buildYield(from, to)
{
	var y = document.createElement("div");
	y.style.marginTop = "10px";
	y.style.color = "darkred";
	y.appendChild(document.createTextNode(getYield(from, to)));
	return y;
}

function show_discriminants()
{
	var discs = message.discriminants.sort(
		function(x,y) { return (x.to - x.from) - (y.to - y.from); } );
	var div = document.getElementById("disc-scroller");
	while(div.firstChild)div.removeChild(div.firstChild);
	for(var x in discs)
	{
		var dd = document.createElement("div");
		dd.style.cssFloat = "left";
		dd.style.margin = "10px";
		dd.style.padding = "10px";
		dd.style.border = "1px solid #c94";
		dd.style.background = "#ccf";
		dd.style.textAlign = "center";
		dd.appendChild(buildUnaryChain(discs[x].sign));
		if(dspan == "" || (dspanto-dspanfrom < 2))
		{
			var yield = buildYield(discs[x].from, discs[x].to);
			dd.appendChild(yield);
		}
		var count = document.createElement("div");
		count.style.marginTop = "10px";
		count.style.fontWeight = "bold";
		count.style.color = "darkgreen";
		count.appendChild(document.createTextNode(discs[x].count + " trees"));
		dd.appendChild(count);
		dd.discriminant = discs[x];
		dd.onclick = function(x){return function(ev){
			unhilight_dec(); select_discriminant(x.discriminant);}}(dd);
		if(dspan == "")
		{
			dd.onmouseover = function(x){return function(ev){
				hilight_dec(discs[x].from, discs[x].to);}}(x);
			dd.onmouseout = function(x){return function(ev){
				unhilight_dec();}}();
		}
		div.appendChild(dd);
	}
}

function show_item_and_profile_id()
{
	document.getElementById("profile-id").innerHTML = message.profile_id;
	document.getElementById("item-id").innerHTML = message.item_id;
	document.getElementById("nextlink").href = "next" + window.location.search;
	document.getElementById("prevlink").href = "prev" + window.location.search;
	document.getElementById("listlink").href = "/private" + message.profile_id;
}
