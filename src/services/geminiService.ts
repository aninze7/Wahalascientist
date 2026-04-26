export interface WahalaContent {
  shortResponse: string;
  script: string;
}

export const generateWahalaContent = async (complaint: string): Promise<WahalaContent> => {
  console.log("Gemini Service: Calling backend AI generation...");
  
  try {
    const response = await fetch("/api/generate-wahala", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ complaint }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini Service: AI response received from backend");
    return data;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
