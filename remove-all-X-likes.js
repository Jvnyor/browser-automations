function nextUnlike() {
  return document.querySelector('[data-testid="unlike"]');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function removeAllLikes() {
  let count = 0;
  let next = nextUnlike();
  let waitTime = 3000; // Initial wait time (3 seconds)

  while (next && count < 1200) {
    try {
      next.focus();
      next.click();
      count++;
      console.log(`Unliked tweet number: ${count}`);

      // Use a small random factor to avoid looking too "bot-like"
      const randomFactor = Math.floor(Math.random() * 1000);
      await wait(waitTime + randomFactor);

      next = nextUnlike();

      // If no unlike button is found, scroll to load more
      if (!next && count < 1200) {
        window.scrollTo(0, document.body.scrollHeight);
        await wait(5000);
        next = nextUnlike();
      }
    } catch (error) {
      console.error('Error occurred:', error);

      // Exponential back-off, maximum 60 seconds
      waitTime = Math.min(waitTime * 2, 60000);
      console.log(`Rate limit or error detected. Increasing wait time to ${waitTime / 1000} seconds.`);

      await wait(waitTime);
    }
  }

  if (next) {
    console.log('Stopped early to avoid potential rate-limiting.');
  } else {
    console.log(`Finished unliking. Total unliked count = ${count}`);
  }
}

removeAllLikes();
