const NUMBER_OF_DECKS = 8;
const SHUFFLE_POINT = 26;		// Shuffle when there is fewer than 26 cards left
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

  if (returnValue < 1) {
    returnValue = 1;
  }
  else if (returnValue > 10000000) {
    returnValue = 10000000;
  }

  $('#simulatedHandsText').val(returnValue)
  return returnValue;
}

function getAccuracy() {
	let returnValue = 100;
  let textValue = parseFloat($('#accuracyText').val());
  if (textValue < 51) {
    returnValue = 51;
  }
  else if (textValue > 100) {
    returnValue = 100;
  }
  else {
    returnValue = textValue;
  }

  $('#accuracyText').val(returnValue)

  return returnValue;
}

function formatPercentage(value, places) {
	let returnValue = parseFloat(value);
  returnValue = 100.0 * returnValue;
  if (places >= 0) {
    returnValue = returnValue.toFixed(places) + '%';
  }
  else {
    returnValue = returnValue.toFixed(2) + '%';
  }
  
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
}

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
  let returnValue = shoe.pop();
  discardTray.push(returnValue);
  
  return returnValue;
}

function resetStats() {
  totalBankerWins = 0;
  totalPlayerWins = 0;
  totalTies = 0;
	totalCorrectBets = 0;
	totalIncorrectBets = 0;
  totalAmountWagered = 0;

  for (let i = 0; i < 10; i++) {
    startCardBankerWins[i] = 0;
    startCardPlayerWins[i] = 0;
    startCardTies[i] = 0;
  }
  
  winTotal = 0.0;
}

function processHand(playerCards, bankerCards, bettingConfig, accuracy) {
  let playerTotal = getHandValue(playerCards);
	let bankerTotal = getHandValue(bankerCards);
  let firstCard = playerCards[0];
  
  let betIsOnBanker = true;

	let playerBetAmount = bettingConfig.taggedBetPlayer;
  let bankerBetAmount = bettingConfig.taggedBetBanker;
  let tieBetAmount = bettingConfig.taggedBetTie;

  let cardIsSortedAccurately = true;
  let firstCardIsTagged = tagged[firstCard];

  if (accuracy < 100) {
    let randomIndex = getRandomInt(100);
    if (randomIndex > accuracy) {
      cardIsSortedAccurately = false;
    }
  }

  if (!cardIsSortedAccurately) {
    firstCardIsTagged = !firstCardIsTagged;
  }

  // Figure out the bets
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

  // Update the running bet amounts
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
      totalIncorrectBets++;
      winTotal -= playerBetAmount;
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

function dealHand(bettingConfig, accuracy) {
	if (shoe.length < SHUFFLE_POINT) {
    shoe.push(...discardTray);
    discardTray.length = 0
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
    processHand(playerCards, bankerCards, bettingConfig, accuracy);
    return;
  }
  
  if (playerTotal < 6) {
  	// Player draws third card 
  	playerCards[2] = dealTopCard();
    playerCardDrawn = true;
  }
  
  let player3rdCard = playerCards[2];
  
  if (!playerCardDrawn && bankerTotal < 6
  		|| playerCardDrawn && bankerTotal < 3
  		|| playerCardDrawn && bankerTotal === 3 && player3rdCard !== 8
  		|| playerCardDrawn && bankerTotal === 4 && player3rdCard > 1 && player3rdCard < 8
  		|| playerCardDrawn && bankerTotal === 5 && player3rdCard > 3 && player3rdCard < 8
  		|| playerCardDrawn && bankerTotal === 6 && player3rdCard > 5 && player3rdCard < 8
      ) {
  	// Player draws third card 
  	bankerCards[2] = dealTopCard();
  }
  
  processHand(playerCards, bankerCards, bettingConfig, accuracy);  
}

// Executed when simulation is complete
function updateUI() {
	let simulatedHandCount = getSimulatedHandCount();
  let accuracy = getAccuracy();
  
  if (simulatedHandCount <= 0) {
	  return;
  }
  
	$('#totalHandsSpan').text(simulatedHandCount.toLocaleString('en-us'));
	$('#accuracySpan').text(formatPercentage(accuracy/100.00, 0));
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
  if (totalAmountWagered > 0) {
    $('#totalWinAmountPercentageSpan').text(formatPercentage(winTotal/totalAmountWagered));
  }
  else {
    $('#totalWinAmountPercentageSpan').text('--');
  }
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
		$('#card' + i + 'PlayerWinsSpan').text(startCardPlayerWins[i].toLocaleString('en-us'));
		$('#card' + i + 'TiesSpan').text(startCardTies[i].toLocaleString('en-us'));

    if (totalHands > 0) {
      $('#card' + i + 'BankerWinPercentSpan').text(formatPercentage(startCardBankerWins[i] / totalHands));
      $('#card' + i + 'PlayerWinPercentSpan').text(formatPercentage(startCardPlayerWins[i] / totalHands));
      $('#card' + i + 'TiePercentSpan').text(formatPercentage(startCardTies[i] / totalHands));
    }
    else {
      $('#card' + i + 'BankerWinPercentSpan').text('--');
      $('#card' + i + 'PlayerWinPercentSpan').text('--');
      $('#card' + i + 'TiePercentSpan').text('--');
    }
    
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
  $('#loading').show();
  setTimeout(() => { asyncSimulation(); }, 10);
}

function asyncSimulation() {
	let simulatedHandCount = getSimulatedHandCount();
	let accuracy = getAccuracy();
  let bettingConfig = getBettingConfig();

  if (simulatedHandCount <= 0) {
	  return;
  }
  
  shuffle();
  resetStats();

  for (let j = 0; j < simulatedHandCount; j++) {
    dealHand(bettingConfig, accuracy);
  }
  
  endTime = new Date();
  updateUI();
  hideLoader();
}

function hideLoader() {
  $('#loading').hide();
}

function init() {
  hideLoader();
  initializeShoe(NUMBER_OF_DECKS);
}

$(document).ready(function() {
  init();
});
