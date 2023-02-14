const NUMBER_OF_DECKS = 8;
const SHUFFLE_POINT = 26;		// Shuffle when there is fewer than 104 cards left
const NUMBER_OF_HANDS = 1000000;
const IMGURL_CARD_BACK_UNTAGGED = "/assets/img/cards/card-back-short-edge-3500x2500.png";
const IMGURL_CARD_BACK_TAGGED = "/assets/img/cards/card-back-long-edge-3500x2500.png";

let shoe = [];
let discardTray = [];

let totalBankerWins = 0;
let totalPlayerWins = 0;
let totalTies = 0;
let totalAmountWagered = 0;
let totalCorrectBets = 0;
let totalIncorrectBets = 0;

let startCardBankerWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let startCardPlayerWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let startCardTies = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// Let's edge sort the 6, 7, 8, 9 - they result in a player advantage
let tagged = [false, false, false, false, false, false, true, true, true, true];
// First amount is Tagged bet on Player, Second value is NOT tagged bet on Banker
//let betAmountsTagged = [100, 100];

let winTotal = 0.0;
let startTime, endTime;

function getHandValue(cardArray) {
	if (cardArray.length == 2) {
    return (cardArray[0] + cardArray[1]) % 10;
  }

	if (cardArray.length == 3) {
    return (cardArray[0] + cardArray[1] + cardArray[2]) % 10;
  }

	console.error('ERROR: YOU NEED 2 OR 3 CARDS TO GET THE HAND TOTAL');
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getSimulatedHandCount() {
	let returnValue = -1;
  returnValue = parseInt($('#simulatedHandsText').val());
  return returnValue;
}

function formatPercentage(value) {
	let returnValue = parseFloat(value);
  returnValue = 100.0 * returnValue;
  returnValue = returnValue.toFixed(2) + '%';
  
  return returnValue;
}

function getBettingConfig() {
	let untaggedBetBanker = parseInt($('#untaggedBetBankerText').val());
	let untaggedBetPlayer = parseInt($('#untaggedBetPlayerText').val());
	let untaggedBetTie = parseInt($('#untaggedBetTieText').val());
	let taggedBetBanker = parseInt($('#taggedBetBankerText').val());
	let taggedBetPlayer = parseInt($('#taggedBetPlayerText').val());
	let taggedBetTie = parseInt($('#taggedBetTieText').val());

	return {
  	untaggedBetBanker: parseInt(untaggedBetBanker),
  	untaggedBetPlayer: parseInt(untaggedBetPlayer),
  	untaggedBetTie: parseInt(untaggedBetTie),
  	taggedBetBanker: parseInt(taggedBetBanker),
  	taggedBetPlayer: parseInt(taggedBetPlayer),
  	taggedBetTie: parseInt(taggedBetTie)
  }
}

// Zero out a banker or player bet if there are two positive values
function cleanUpBets() {
	let bettingConfig = getBettingConfig();
  
  if (bettingConfig.untaggedBetBanker > 0 && bettingConfig.untaggedBetPlayer > 0) {
  	if (bettingConfig.untaggedBetBanker > bettingConfig.untaggedBetPlayer) {
			$('#untaggedBetPlayerText').val(0);
    }
    else {
			$('#untaggedBetBankerText').val(0);
    }
  }
  
  if (bettingConfig.taggedBetBanker > 0 && bettingConfig.taggedBetPlayer > 0) {
  	if (bettingConfig.taggedBetBanker > bettingConfig.taggedBetPlayer) {
			$('#taggedBetPlayerText').val(0);
    }
    else {
			$('#taggedBetBankerText').val(0);
    }
  }
}

function getIsTagged(index) {
  let cssClass = $('#cardEdge' + index).attr('class');
  return cssClass === "tagged";
}

function toggleCardEdge(index) {
	let isTagged = getIsTagged(index);
  if (isTagged) {
  	$('#cardEdge' + index).attr('class', 'untagged');
  	$('#cardEdge' + index).attr('src', IMGURL_CARD_BACK_UNTAGGED);
  }
  else {
  	$('#cardEdge' + index).attr('class', 'tagged');
  	$('#cardEdge' + index).attr('src', IMGURL_CARD_BACK_TAGGED);
  }
  
  tagged[index] = !tagged[index];
}

function getTagged() {
		// tagged
    let returnValue = [];
  	for (let i = 0; i < 10; i++) {
      returnValue.push(getIsTagged(i));
    }
    
    return returnValue;
}

// TODO: Pass in shoe
function initializeShoe(numberOfDecks) {
	shoe = [];

	for (let i = 0; i < numberOfDecks * 4; i++) {
  	// Loop through decks * 4 suits
    for (let j = 0; j < 4; j++) {
      // Push the tens and face cards
      shoe.push(0);
    }
    for (let j = 1; j < 10; j++) {
      // Push the other ranks
      shoe.push(j);
    }
  }

  console.log('INITIALIZED: ' + shoe.length);
}

// TODO: Pass in shoe
// NOTES: This shuffles whatever is in the shoe (undealt cards)
function shuffle() {
	let randomIndex = 0;
  let shoeLength = shoe.length;
  let currentLength = 0;

  let shuffledShoe = [];
	for (let i = 0; i < shoeLength; i++) {
  	currentLength = shoe.length;
  	randomIndex = getRandomInt(currentLength);
    shuffledShoe.push(shoe[randomIndex]);
    shoe.splice(randomIndex, 1);
  }
  
  shoe.push(...shuffledShoe);
  return;
}

function dealTopCard() {
	let topCardIndex = shoe.length - 1;
	let returnValue = shoe[topCardIndex];
  
  discardTray.push(returnValue);
  shoe.splice(topCardIndex, 1); // pop?
  
  return returnValue;
}

function resetStats() {
  totalBankerWins = 0;
  totalPlayerWins = 0;
  totalTies = 0;
	totalCorrectBets = 0;
	totalIncorrectBets = 0;
  totalAmountWagered = 0;

	startCardBankerWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  startCardPlayerWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  startCardTies = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  winTotal = 0.0;
}

function processHand(playerCards, bankerCards, bettingConfig) {
  let playerTotal = getHandValue(playerCards);
	let bankerTotal = getHandValue(bankerCards);
  let firstCard = playerCards[0];
  
  let firstCardIsTagged = tagged[firstCard];
  let betIsOnBanker = true;

	let playerBetAmount = bettingConfig.taggedBetPlayer;
  let bankerBetAmount = bettingConfig.taggedBetBanker;
  let tieBetAmount = bettingConfig.taggedBetTie;
  
  if (firstCardIsTagged) {
    playerBetAmount = bettingConfig.taggedBetPlayer;
    bankerBetAmount = bettingConfig.taggedBetBanker;
    tieBetAmount = bettingConfig.taggedBetTie;
  }
  else {
    playerBetAmount = bettingConfig.untaggedBetPlayer;
    bankerBetAmount = bettingConfig.untaggedBetBanker;
    tieBetAmount = bettingConfig.untaggedBetTie;
  }

  if (playerBetAmount > bankerBetAmount) {
    betIsOnBanker = false;
    totalAmountWagered += playerBetAmount;
  }
  else {
    totalAmountWagered += bankerBetAmount;
  }

  let tieBetMade = tieBetAmount > 0;
  totalAmountWagered += tieBetAmount;

	if (playerTotal > bankerTotal) {
  	totalPlayerWins++;
	  startCardPlayerWins[firstCard]++;

		if (!betIsOnBanker) {
      totalCorrectBets++;
      winTotal += playerBetAmount;
    }
    else {
      totalIncorrectBets++;
      winTotal -= bankerBetAmount;
    }
    if (tieBetMade) {
      winTotal -= tieBetAmount;
    }
  }
	else if (playerTotal < bankerTotal) {
  	totalBankerWins++;
	  startCardBankerWins[firstCard]++;

		if (!betIsOnBanker) {
      winTotal -= playerBetAmount;
      totalIncorrectBets++;
    }
    else {
      totalCorrectBets++;
      winTotal += bankerBetAmount * 0.95;
    }
    if (tieBetMade) {
      winTotal -= tieBetAmount;
    }
  }
  else {
  	totalTies++;
    startCardTies[firstCard]++;
    if (tieBetMade) {
      winTotal += tieBetAmount * 8;
    }
  }
}

function dealHand(bettingConfig) {
	if (shoe.length < SHUFFLE_POINT) {
    //console.log('SHUFFLING at ' + shoe.length);
    shoe.push(...discardTray);
    discardTray = [];
    shuffle();
	}
  
	let playerCards = [];
  let bankerCards = [];
  
  for (let i = 0; i < 2; i++) {
  	// Player gets the first card! Important!
  	playerCards[i] = dealTopCard();
  	bankerCards[i] = dealTopCard();
  }

  let playerTotal = getHandValue(playerCards);
  let bankerTotal = getHandValue(bankerCards);
  let playerCardDrawn = false;
  
  if (playerTotal > 7 || bankerTotal > 7) {
  	// Someone has a natural...
    processHand(playerCards, bankerCards, bettingConfig);
    return;
  }
  
  if (playerTotal < 6) {
  	// Player draws third card 
  	playerCards[2] = dealTopCard();
    playerCardDrawn = true;
  }
  
  // TODO: Need to figure out 
  
  if (!playerCardDrawn && bankerTotal < 6
  		|| playerCardDrawn && bankerTotal < 3
  		|| playerCardDrawn && bankerTotal === 3 && playerCards[2] !== 8
  		|| playerCardDrawn && bankerTotal === 4 && playerCards[2] > 1 && playerCards[2] < 8
  		|| playerCardDrawn && bankerTotal === 5 && playerCards[2] > 3 && playerCards[2] < 8
  		|| playerCardDrawn && bankerTotal === 6 && playerCards[2] > 5 && playerCards[2] < 8
      ) {
  	// Player draws third card 
  	bankerCards[2] = dealTopCard();
  }
  
  processHand(playerCards, bankerCards, bettingConfig);  
}

function updateUI() {
	let simulatedHandCount = getSimulatedHandCount();
  
  if (simulatedHandCount <= 0) {
	  return;
  }
  
	$('#totalHandsSpan').text(simulatedHandCount.toLocaleString('en-us'));
	$('#totalBankerWinsSpan').text(totalBankerWins.toLocaleString('en-us'));
	$('#totalBankerWinsPercentSpan').text(formatPercentage(totalBankerWins/simulatedHandCount));
	$('#totalPlayerWinsSpan').text(totalPlayerWins.toLocaleString('en-us'));
	$('#totalPlayerWinsPercentSpan').text(formatPercentage(totalPlayerWins/simulatedHandCount));
	$('#totalTiesSpan').text(totalTies.toLocaleString('en-us'));
	$('#totalTiesPercentSpan').text(formatPercentage(totalTies/simulatedHandCount));
 	$('#totalCorrectBetsSpan').text(totalCorrectBets.toLocaleString('en-us'));
  $('#totalIncorrectBetsSpan').text(totalIncorrectBets.toLocaleString('en-us'));
  $('#totalAmountWageredSpan').text(totalAmountWagered.toLocaleString('en-us'));

	$('#totalWinAmountSpan').text(winTotal.toLocaleString('en-us'));
  $('#totalWinAmountPercentageSpan').text(formatPercentage(winTotal/totalAmountWagered));
  if (winTotal < 0) {
    $('#totalWinAmountSpan').attr('class', 'negative');
    $('#totalWinAmountPercentageSpan').attr('class', 'negative');
  }
  else {
    $('#totalWinAmountSpan').attr('class', 'positive');
    $('#totalWinAmountPercentageSpan').attr('class', 'positive');
  }

	for (let i = 0; i < 10; i++) {
    let totalHands = startCardBankerWins[i] + startCardPlayerWins[i] + startCardTies[i];
		$('#card' + i + 'BankerWinsSpan').text(startCardBankerWins[i].toLocaleString('en-us'));
		$('#card' + i + 'BankerWinPercentSpan').text(formatPercentage(startCardBankerWins[i] / totalHands));
		$('#card' + i + 'PlayerWinsSpan').text(startCardPlayerWins[i].toLocaleString('en-us'));
		$('#card' + i + 'PlayerWinPercentSpan').text(formatPercentage(startCardPlayerWins[i] / totalHands));
		$('#card' + i + 'TiesSpan').text(startCardTies[i].toLocaleString('en-us'));
		$('#card' + i + 'TiePercentSpan').text(formatPercentage(startCardTies[i] / totalHands));
    
    if (startCardBankerWins[i] > startCardPlayerWins[i]) {
      $('#card' + i + 'BankerWinsSpan').attr('class','positive');
      $('#card' + i + 'BankerWinPercentSpan').attr('class','positive');
      $('#card' + i + 'PlayerWinsSpan').attr('class','negative');
      $('#card' + i + 'PlayerWinPercentSpan').attr('class','negative');
    }
    else {
      $('#card' + i + 'BankerWinsSpan').attr('class','negative');
      $('#card' + i + 'BankerWinPercentSpan').attr('class','negative');
      $('#card' + i + 'PlayerWinsSpan').attr('class','positive');
      $('#card' + i + 'PlayerWinPercentSpan').attr('class','positive');
    }
  }
  $('#elapsedTimeSpan').text(((endTime - startTime)/1000).toFixed(3) + ' sec');
}

function runSimulation() {
  startTime = new Date();
	let simulatedHandCount = getSimulatedHandCount();
  let bettingConfig = getBettingConfig();
  
  if (simulatedHandCount <= 0) {
	  return;
  }
  
  //initializeShoe(NUMBER_OF_DECKS);
  shuffle();
  resetStats();
  //tagged = getTagged();

  for (let j = 0; j < simulatedHandCount; j++) {
    dealHand(bettingConfig);
  }
  
  endTime = new Date();
  updateUI();
}

initializeShoe(NUMBER_OF_DECKS);
  