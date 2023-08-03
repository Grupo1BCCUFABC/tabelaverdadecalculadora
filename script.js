
const characters = { "cFalse": 'F', "cTrue": 'V' };
let resulting = [];

const buttons = document.querySelectorAll('.buttons button');

function showExplanation(event) {
	const button = event.target;
	const explanation = button.getAttribute('data-title');
	const tooltip = document.createElement('div');
	tooltip.classList.add('tooltip');
	tooltip.textContent = explanation;
	document.body.appendChild(tooltip);
	const buttonRect = button.getBoundingClientRect();
	tooltip.style.top = buttonRect.bottom + 'px';
	tooltip.style.left = buttonRect.left + 'px';
}
function hideExplanation() {
	const tooltip = document.querySelector('.tooltip');
	if (tooltip) {
		tooltip.remove();
	}
}
buttons.forEach((button) => {
	button.addEventListener('mouseover', showExplanation);
	button.addEventListener('mouseout', hideExplanation);
});
function clearAll() {
	const inputField = document.getElementById('in');
	const tableScreen = document.getElementById('table_screen');
	inputField.value = '';
	tableScreen.innerHTML = '';
}

function appendToScreen(value) {
	document.getElementById('in').value += value + ' ';
}
function standardCharacters(c) {
	const charMap = {
		true: characters.cTrue,
		false: characters.cFalse,
		'¬': '&not;',
		'∧': '&and;',
		'∨': '&or;',
		'→': '&rarr;',
		'↔': '&harr;',
	};

	return charMap[c] || c;
}
function makeTable() {
	const formulas = document.getElementById('in').value.replace(/ /g, '');
	const formInfo = formulas.split(/[,:]+/);
	let info = formInfo.map(parseFormula);
	const variables = info.length;
	if (formulas === '') {
		return showAlert("Você precisa digitar alguma fórmula válida", "error");
	}
	const r = badchar(formulas);
	if (r >= 0) {
		return showAlert("Você digitou um símbolo não identificado (" + formulas[r] + ')', "error");
	}
	for (let i = 0; i < variables; i++) {
		if (info[i].length === 0) {
			formInfo[i] = '(' + formInfo[i] + ')';
			info[i] = parseFormula(formInfo[i]);
		}
	}
	if (info.some((a) => a.length === 0 || a.length === 1)) {
		return showAlert("Sintaxe Inválida!", "error");
	}
	const table = createTable(formInfo, info);
	const main = true;
	if (main) {
		const tableTrue = createInTable(table, info, main);
		document.getElementById('table_screen').innerHTML = tableTrue;
	}
	function showAlert(message, type) {
		const alertDiv = document.createElement('div');
		alertDiv.classList.add('custom-alert', type === 'error' ? 'error' : 'success');
		alertDiv.textContent = message;
		document.body.appendChild(alertDiv);

		setTimeout(() => {
			alertDiv.remove();
		}, 3000);
	}
}
function createInTable(table, info, flag) {
	const mainConnectives = info.map(getPrimaryConnective);
	let alt = '<table id="primary_table">';
	alt += createTableHeaderRow(table);
	for (let i = 1; i < table[0].length; i++)
		alt += createTableRow(table, i);
	return alt + '</table>';
	function createTableHeaderRow(tab) {
		let rowturn = '<tr>';
		rowturn += '<td></td>';

		for (let i = 0; i < tab.length; i++) {
			for (let v = 0; v < tab[i][0].length; v++) {
				if (v === tab[i][0].length - 1 && i !== tab.length - 1) {
					rowturn += '<th>' + standardCharacters(tab[i][0][v]) + '</th>' + '<th class="dv"></th><th></th>';
				} else {
					rowturn += '<th>' + standardCharacters(tab[i][0][v]) + '</th>';
				}
			}
		}
		return rowturn + '</tr>';
	}
	function createTableRow(tab, r) {
		const lineLength = tab.length;
		let row = '<tr>';
		let resulting = [];
		for (let i = 0; i < lineLength; i++) {
			for (let j = 0; j < tab[i][r].length; j++) {
				const resultP = standardCharacters(tab[i][r][j]);
				if (mainConnectives[i - 1] === j) {
					if (lineLength > 2) {
						resulting.push(resultP);
					}
					const color = resultP === characters.cTrue ? 'green' : 'red';
					row += `<td id='resultfin' style="color:${color}">${resultP}</td>`;
				} else if (flag && i > 0) {
					row += '<td></td>';
				} else {
					row += `<td id='trueor'>${standardCharacters(tab[i][r][j])}</td>`;
				}
				if (j === tab[i][r].length - 1 && i !== lineLength - 1) {
					row += '<td class="dv"></td><td></td>';
				}
			}
		}
		return row + '</tr>';
	}
}
function getPrimaryConnective(t) {
	return t.length <= 2 ? 0 : countLeaves(t[1]) + 1;
}
function countLeaves(t) {
	let count = 0;
	t.forEach(node => {
		if (Array.isArray(node)) {
			count += countLeaves(node);
		} else {
			count++;
		}
	});
	return count;
}
function createTable(pry, sec) {
	const listTable = createListTable(pry);
	const MapFloat = pry.map((formula, index) => createTableSegment(formula, sec[index], listTable));
	return [listTable, ...MapFloat];
}
function createListTable(pry) {
	const mainConnection = pry.flatMap(getMainConnection);
	const uniqueMainConnection = rand(throwDup(mainConnection));
	const valueRows = mainConnection.includes('#') ? combineValues(uniqueMainConnection.length - 1) : combineValues(uniqueMainConnection.length);
	const listTable = [uniqueMainConnection, ...valueRows];
	return listTable;
}
function createTableSegment(s, l, listTable) {
	const tableRows = listTable.slice(1).map((assignment) => {
		const row = tableEval(l, createAssignment(listTable[0], assignment));
		return format(row);
	});

	return [format(l), ...tableRows];
}
function getMainConnection(s) {
	return Array.from(s).filter(clearMainConnection);
}
function combineValues(n) {
	if (n === 0) {
		return [[]];
	}
	const prev = combineValues(n - 1);
	return [...prev.map(x => [true, ...x]), ...prev.map(x => [false, ...x])];
}
function createAssignment(s, b) {
	return s.reduce((assignment, chard, index) => {
		assignment[chard] = b[index];
		return assignment;
	}, {});
}
function format(t) {
	if (t.length == 5) {
		return [].concat(t[0]).concat(format(t[1])).concat(t[2]).concat(format(t[3])).concat(t[4]);
	} else if (t.length == 2) {
		return [].concat(t[0]).concat(format(t[1]));
	} else if (t.length == 1) {
		return [].concat(t[0]);
	}
}
function tableEval(z, k) {
	if (z.length === 5) {
		const x = tableEval(z[1], k);
		const y = tableEval(z[3], k);
		return ['', x, getValue([z[2], x, y]), y, ''];
	} else if (z.length === 2) {
		const x = tableEval(z[1], k);
		return [getValue([z[0], x]), x];
	} else if (z.length === 1) {
		return [k[z[0]]];
	}
}
function getValue(sets) {
	const operators = {
		'¬': () => !evaluate(sets[1]),
		'∧': () => evaluate(sets[1]) && evaluate(sets[2]),
		'∨': () => evaluate(sets[1]) || evaluate(sets[2]),
		'→': () => (!evaluate(sets[1]) || evaluate(sets[2])),
		'↔': () => (evaluate(sets[1]) === evaluate(sets[2])),
		'|': () => (!(evaluate(sets[1]) && evaluate(sets[2]))),
	};
	function evaluate(x) {
		switch (x.length) {
			case 5: return x[2];
			case 2: return x[0];
			case 1: return x[0];
		}
	}

	return operators[sets[0]]();
}
function throwDup(sets) {
	return sets.filter((el, pos) => sets.indexOf(el) === pos);
}
function rand(sets) {
	return [...sets].sort((a, b) => a.charAt(0) - b.charAt(0));
}
function parseFormula(s) {
	if (s.length === 0) {
		return [];
	}
	if (singleValy(s[0])) {
		const sS = parseFormula(s.substring(1));
		return sS.length ? [s[0], sS] : [];
	}
	if (s[0] === '(' && s[s.length - 1] === ')') {
		const a = getSubstring(s);
		if (a.some(el => el === undefined || el === '')) {
			return [];
		} else {
			const sS = parseFormula(a[0]);
			const pP = parseFormula(a[2]);
			return sS.length && pP.length ? ['(', sS, a[1], pP, ')'] : [];
		}
	} else {
		return clearMainConnection(s) ? [s] : [];
	}
}
function clearMainConnection(s) {
	const permittedSymbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuwxyz';
	return s.length === 1 && permittedSymbols.includes(s);
}
function singleValy(s) {
	return s.startsWith('¬');
}
function getSubstring(s) {
	let stack = 0;
	let l = 0;

	for (let i = 0; i < s.length; i++) {
		if (s[i] === '(') {
			stack++;
		} else if (s[i] === ')' && stack > 0) {
			stack--;
		} else if (stack === 1 && (l = lawful(s.substring(i))) > 0) {
			return [s.substring(1, i), s.substring(i, i + l), s.substring(i + l, s.length - 1)];
		}
	}
	return [undefined, undefined, undefined];
}
function lawful(s) {
	const symbolConnectives = ['∧', '∨', '→', '↔', '|'];
	for (const symbolConnective of symbolConnectives) {
		if (s.startsWith(symbolConnective)) {
			return symbolConnective.length;
		}
	}
	return 0;
}
function badchar(s) {
	const permittedSymbols = ':,()¬∨∧↔→|#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuwxyz';
	for (let i = 0; i < s.length; i++) {
		if (!permittedSymbols.includes(s[i])) {
			return i;
		}
	}
	return -1;
}
