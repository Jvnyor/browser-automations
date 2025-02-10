/********************************************
  1) Helper: Sleep for a given time in ms
*********************************************/
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/********************************************
  2) Main Bulk-Deletion Function
*********************************************/
async function bulkDeleteReplies() {
  console.log("Starting to delete your tweets/replies...");

  let deletedCount = 0;         // number of tweets actually deleted
  let processedCount = 0;       // total tweets processed (deleted or skipped)
  const MAX_LOOPS = 5000;       // safety cutoff (avoid infinite loops)
  const baseWait   = 2000;      // base delay between attempts (ms)
  const scrollWait = 3000;      // wait after scrolling (ms)

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    // 1) Grab all visible tweets on the page
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    if (!tweets.length) {
      // No tweets found => scroll to load more
      console.log("No tweets found. Scrolling...");
      window.scrollTo(0, document.body.scrollHeight);
      await wait(scrollWait);

      // Check again
      const newTweets = document.querySelectorAll('article[data-testid="tweet"]');
      if (!newTweets.length) {
        console.log("No more tweets/replies to process. Stopping.");
        break;
      }
      continue;
    }

    // 2) Process the first tweet in the list
    const tweet = tweets[0];
    const success = await attemptDeleteOneTweet(tweet);

    processedCount++;
    if (success) {
      deletedCount++;
      console.log(`Deleted so far: ${deletedCount} (out of ${processedCount} processed).`);
    } else {
      console.log(`Skipped a tweet. Deleted: ${deletedCount}, processed: ${processedCount}.`);
    }

    // 3) Wait before attempting the next tweet
    await wait(baseWait);
  }

  console.log(`Finished. Total processed: ${processedCount}, total deleted: ${deletedCount}.`);
}

/********************************************
  3) Delete a Single Tweet (returns true/false)
*********************************************/
async function attemptDeleteOneTweet(tweetEl) {
  try {
    // 1) Find the "More" (caret) button in this tweet
    //    Typically [data-testid="caret"] or [aria-label="More"][role="button"]
    const caretBtn = tweetEl.querySelector('[data-testid="caret"], div[aria-label="More"][role="button"]');
    if (!caretBtn) {
      // If there's no caret, it's likely not yours to delete
      removeElement(tweetEl);
      return false;
    }

    // 2) Click the caret to open the menu
    caretBtn.click();
    await wait(800); // wait for the menu to appear

    // 3) Look for a “Delete” item in the menu
    //    (Might say "Delete Tweet" or "Delete" — we check if text includes "delete")
    let deleteButton = null;
    const menuItems = document.querySelectorAll('div[role="menuitem"], div[role="menuitemradio"]');
    for (const item of menuItems) {
      if (item.innerText.trim().toLowerCase().includes("delete")) {
        deleteButton = item;
        break;
      }
    }

    // If no “Delete” option, skip (maybe a retweet or someone else’s tweet)
    if (!deleteButton) {
      document.body.click(); // close the menu
      await wait(500);
      removeElement(tweetEl);
      return false;
    }

    // 4) Click “Delete”
    deleteButton.click();
    await wait(800); // wait for confirmation pop-up

    // 5) Click the *confirmation* “Delete”
    //    - Often data-testid="confirmationSheetConfirm"
    //    - Or we fallback to a button with text "Delete"
    let confirmed = await clickConfirmationDelete();
    if (!confirmed) {
      // If we couldn't confirm, remove tweet from DOM to skip
      removeElement(tweetEl);
      return false;
    }

    // 6) Remove from DOM so we don't re-process
    await wait(500);
    removeElement(tweetEl);
    return true;
  } catch (err) {
    console.error("Error in attemptDeleteOneTweet:", err);
    removeElement(tweetEl);
    return false;
  }
}

/********************************************
  4) Click the confirmation “Delete” in the pop-up
*********************************************/
async function clickConfirmationDelete() {
  // First, try data-testid="confirmationSheetConfirm"
  let confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');
  if (confirmButton) {
    confirmButton.click();
    return true;
  }

  // If that didn't work, look for a button whose text includes "delete"
  const confirmItems = document.querySelectorAll('div[role="button"], div[role="menuitem"]');
  for (const item of confirmItems) {
    if (item.innerText.trim().toLowerCase() === "delete" ||
        item.innerText.trim().toLowerCase().includes("delete")) {
      item.click();
      return true;
    }
  }

  // Could not find a second “Delete”
  return false;
}

/********************************************
  5) Remove an element from DOM
*********************************************/
function removeElement(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/********************************************
  6) Start the process
*********************************************/
bulkDeleteReplies();
