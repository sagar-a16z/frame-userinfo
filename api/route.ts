import { NextApiRequest, NextApiResponse } from "next";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
import { UserInfoArguments, encodeUserInfoArguments } from "./image";

const HUB_URL = process.env["HUB_URL"] || "nemes.farcaster.xyz:2283";
const client = getSSLHubRpcClient(HUB_URL);

export default async function getResponse(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "POST") {
    try {
      let validatedMessage: Message | undefined = undefined;
      try {
        const frameMessage = Message.decode(
          Buffer.from(req.body?.trustedData?.messageBytes || "", "hex")
        );
        const result = await client.validateMessage(frameMessage);
        if (result.isOk() && result.value.valid) {
          validatedMessage = result.value.message;
        }

        const buttonId =
          validatedMessage?.data?.frameActionBody?.buttonIndex || 0;
        const fid = validatedMessage?.data?.fid || 0;

        const userData: UserInfoArguments = {
          fid: fid,
          casts: 10,
          maxCasts: 500,
          reactions: 500,
          maxReactions: 500,
        };

        const imageUrl = `${
          process.env["HOST"]
        }/api/image?data=${encodeUserInfoArguments(
          userData
        )}&date=${Date.now()}`;

        // Return an HTML response
        res.setHeader("Content-Type", "text/html");
        res.status(200).send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Protocol Usage</title>
      <meta property="og:title" content="Protocol Usage">
      <meta property="og:image" content="${imageUrl}">
      <meta name="fc:frame" content="vNext">
      <meta name="fc:frame:image" content="${imageUrl}">
    </head>
  </html>
  `);
      } catch (e) {
        return res.status(400).send(`Failed to validate message: ${e}`);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error generating image");
    }
  } else {
    // Handle any non-POST requests
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const dynamic = "force-dynamic";
