export interface AlertPayload {
    player: string;
    stat: string;
    line: string;
    true_prob: string;
    edge: string;
    bookmaker: string;
}

export const PickLabsAlertEngine = {
    sendDiscordVIPAlert: (payload: AlertPayload) => {
        console.log(
            `%c[DISCORD WEBHOOK FIRED]`,
            'color: #5865F2; font-weight: bold; background: #2f3136; padding: 2px 6px; border-radius: 4px;',
            `\n🚨 MASSIVE EDGE DETECTED 🚨\nPlayer: ${payload.player}\nStat: ${payload.stat}\nLine: ${payload.line}\nTrue Prob: ${payload.true_prob}\nEdge: ${payload.edge}%\nBook: ${payload.bookmaker}`
        );
    },

    sendSMSAlert: (phone: string, payload: AlertPayload) => {
        console.log(
            `%c[SMS SENT TO ${phone}]`,
            'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 6px; border-radius: 4px;',
            `\nPickLabs VIP Alert: ${payload.player} ${payload.stat} ${payload.line}. Edge: ${payload.edge}% at ${payload.bookmaker}.`
        );
    },

    sendBugReportEmail: (email: string, issueType: string, description: string) => {
        console.log(
            `%c[EMAIL SENT TO ADMIN]`, `color: #f59e0b; font-weight: bold; background: #451a03; padding: 2px 6px; border-radius: 4px;`,
            `\n🚨 Bug Report from: ${email}\nType: ${issueType}\nDescription: ${description}`
        );
    }
};
