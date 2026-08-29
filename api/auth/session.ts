import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handle } from "../../endpoints/auth/session_GET";
import { runWebHandler } from "../_adapter";

export default (req: VercelRequest, res: VercelResponse) => runWebHandler(req, res, handle);
