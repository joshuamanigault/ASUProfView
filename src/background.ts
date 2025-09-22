import { RateMyProfessor } from "rate-my-professor-api-ts"

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    
    if (request.professorName) {
      (async () => {
        try {
          const rmp_instance = new RateMyProfessor("Arizona State University", request.professorName);
          const professor_info = await rmp_instance.get_professor_info();
          sendResponse({ success: true, data: professor_info });
        } catch (error) {
          console.error("Error fetching professor info:", error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      
      return true; // Keep the message channel open for async response
    }
  }
);