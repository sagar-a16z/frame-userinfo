import { StorageLimit } from "@farcaster/hub-nodejs";
import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export type UserInfoArguments = {
  fid?: number;
  castsLimit?: StorageLimit;
  reactionsLimit?: StorageLimit;
  linksLimit?: StorageLimit;
  verificationsLimit?: StorageLimit;
  storageUnits?: number;
};

// function that can encode any UserInfoArgument into a base64 string
export function encodeUserInfoArguments(args: UserInfoArguments): string {
  const jsonString = JSON.stringify(args);
  return btoa(jsonString);
}

export function decodeUserInfoArguments(data: string): UserInfoArguments {
  // Decode from Base64 to a JSON string
  const jsonString = Buffer.from(data, "base64").toString("utf-8");

  // Parse the JSON string back into an object
  const decodedArgs: UserInfoArguments = JSON.parse(jsonString);
  return decodedArgs;
}

function calculateBarSize(
  storageLimit: StorageLimit | undefined,
  max: number
): number {
  return (storageLimit?.used || 0 / (storageLimit?.limit || 1)) * max;
}

function makeSVGBuffer(userInfo: UserInfoArguments): Buffer {
  // Maybe use satori so it's not so painfully static?
  const fontLargeSize = 20;
  const fontMedSize = 16;
  const fontSmlSize = 14;
  const maxUsageWidth = 670;

  const castBarSize = calculateBarSize(userInfo.castsLimit, maxUsageWidth);
  const reactionsBarSize = calculateBarSize(
    userInfo.reactionsLimit,
    maxUsageWidth
  );

  const svgString = `<svg width="800" height="418" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#333" />

  <!-- FID Text -->
  <text x="40" y="30" fill="white" font-family="Arial" font-size="${fontLargeSize}" font-weight="bold">FID: ${userInfo.fid} (${userInfo.storageUnits} Units of Storage)</text>

  <!-- Labels -->
  <text x="40" y="130" fill="white" font-family="Arial" font-size="${fontMedSize}" font-weight="bold">Casts (${userInfo.castsLimit?.used}/${userInfo.castsLimit?.limit})</text>
  <text x="40" y="200" fill="white" font-family="Arial" font-size="${fontMedSize}" font-weight="bold">Reactions (${userInfo.reactionsLimit?.used}/${userInfo.reactionsLimit?.limit})</text>
  <text x="40" y="270" fill="white" font-family="Arial" font-size="${fontMedSize}" font-weight="bold">Links (${userInfo.linksLimit?.used}/${userInfo.linksLimit?.limit})</text>

  <!-- Maximums -->
  <text x="720" y="165" fill="white" font-family="Arial" font-size="${fontSmlSize}" font-weight="bold">${userInfo.castsLimit?.limit}</text>
  <text x="720" y="235" fill="white" font-family="Arial" font-size="${fontSmlSize}" font-weight="bold">${userInfo.reactionsLimit?.limit}</text>
  <text x="720" y="305" fill="white" font-family="Arial" font-size="${fontSmlSize}" font-weight="bold">${userInfo.linksLimit?.limit}</text>

  <!-- Progress Bars -->
  <!-- Casts Bar -->
  <rect x="40" y="150" width="${maxUsageWidth}" height="20" style="fill:#333;stroke-width:1;stroke:#808080"/>
  <rect x="40" y="150" width="${castBarSize}" height="20" fill="#808080" />

  
  <!-- Reactions Bar -->
  <rect x="40" y="220" width="${maxUsageWidth}" height="20" style="fill:#333;stroke-width:1;stroke:#808080"/>
  <rect x="40" y="220" width="${reactionsBarSize}" height="20" fill="#808080" />

  <!-- Follows Bar -->
  <rect x="40" y="290" width="${maxUsageWidth}" height="20" style="fill:#333;stroke-width:1;stroke:#808080"/>
  <rect x="40" y="290" width="${castBarSize}" height="20" fill="#808080" />
</svg>`;
  return Buffer.from(svgString);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = req.query["data"]?.toString();
    if (!data) {
      return res.status(400).send("Missing user data");
    }
    const userInfo = decodeUserInfoArguments(data);
    const svgBuffer = makeSVGBuffer(userInfo);
    const pngBuffer = await sharp(svgBuffer).toFormat("png").toBuffer();

    // Set the content type to PNG and send the response
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "max-age=10");
    res.send(pngBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating image");
  }
}
