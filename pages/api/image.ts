import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export type UserInfoArguments = {
  fid: number;
  casts: number;
  maxCasts: number;
  reactions: number;
  maxReactions: number;
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

function makeSVGBuffer(userInfo: UserInfoArguments): Buffer {
  const maxUsageWidth = 690;
  const castBarSize = (userInfo.casts / userInfo.maxCasts) * maxUsageWidth;
  const reactionsBarSize =
    (userInfo.reactions / userInfo.reactions) * maxUsageWidth;

  const fontLargeSize = 20;
  const fontMedSize = 16;
  const fontSmlSize = 14;
  const svgString = `<svg width="800" height="418" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#333" />

  <!-- FID Text -->
  <text x="20" y="30" fill="white" font-family="Arial" font-size="${fontLargeSize}" font-weight="bold">FID: ${userInfo.fid}</text>

  <!-- Labels -->
  <text x="20" y="80" fill="white" font-family="Arial" font-size="${fontMedSize}" font-weight="bold">Casts</text>
  <text x="20" y="150" fill="white" font-family="Arial" font-size="${fontMedSize}" font-weight="bold">Reactions</text>
  <text x="20" y="220" fill="white" font-family="Arial" font-size="${fontMedSize}" font-weight="bold">Follows</text>

  <!-- Maximum Value Text -->
  <text x="720" y="115" fill="white" font-family="Arial" font-size="${fontSmlSize}" font-weight="bold">${userInfo.maxCasts}</text>
  <text x="720" y="185" fill="white" font-family="Arial" font-size="${fontSmlSize}" font-weight="bold">${userInfo.maxReactions}</text>
  <text x="720" y="255" fill="white" font-family="Arial" font-size="${fontSmlSize}" font-weight="bold">50000</text>

  <!-- Progress Bars: Adjust 'width' to represent the stat value -->
  <!-- Casts Bar -->
  <rect x="20" y="100" width="${castBarSize}" height="20" fill="gray" />
  
  <!-- Reactions Bar -->
  <rect x="20" y="170" width="${reactionsBarSize}" height="20" fill="gray" />

  <!-- Follows Bar -->
  <rect x="20" y="240" width="${castBarSize}" height="20" fill="gray" />
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
