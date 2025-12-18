/**
 * Africoin Sentinel Reporting Tool
 * Integrates Sui Move (Safety) and Digits AI (Finance)
 */

export const sendReport = async (report) => {
    const endpoint = "https://africa-railways.vercel.app/api/report";
    
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report)
    });

    return response.json();
};
