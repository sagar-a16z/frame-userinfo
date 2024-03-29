import { NextApiRequest, NextApiResponse } from "next";
import {
  FidRequest,
  getSSLHubRpcClient,
  Message,
  StoreType,
} from "@farcaster/hub-nodejs";
import { UserInfoArguments, encodeUserInfoArguments } from "./image";

const HUB_URL = process.env["HUB_URL"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "POST") {
    if (!HUB_URL) {
      return res.status(500).send(`No Hub to talk to :(`);
    }
    const client = getSSLHubRpcClient(HUB_URL);
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

        const fid = validatedMessage?.data?.fid || 0;
        const userData: UserInfoArguments = { fid };

        const storageLimitResult = await client.getCurrentStorageLimitsByFid(
          FidRequest.create({ fid })
        );
        if (storageLimitResult.isOk()) {
          const storageLimits = storageLimitResult.value;
          userData.storageUnits = storageLimits.units;
          for (const limit of storageLimits.limits) {
            switch (limit.storeType) {
              case StoreType.CASTS:
                userData.castsLimit = limit;
                break;
              case StoreType.REACTIONS:
                userData.reactionsLimit = limit;
                break;
              case StoreType.LINKS:
                userData.linksLimit = limit;
                break;
              case StoreType.VERIFICATIONS:
                userData.verificationsLimit = limit;
                break;
              default:
                break;
            }
          }
        } else {
          return res.status(400).send("Missing user data");
        }

        const hosted_url = `https://${req.headers["host"]}`;
        const imageUrl = `${hosted_url}/api/image?data=${encodeUserInfoArguments(
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
      <meta property="fc:frame:button:1" content="Reload">
      <meta property="fc:frame:post_url" content=${hosted_url}/api/getinfo>
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
