import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";
export async function GET(_: Request,{params}:{params:Promise<{id:string}>}){try{const user=await getAuthUser();if(!user)return errorResponse("UNAUTHENTICATED","Sign in required.",401);const {id}=await params;const order=await prisma.order.findFirst({where:{id,userId:user.id},include:{event:true,items:{include:{ticketType:true}},tickets:true,refunds:true}});if(!order)return errorResponse("NOT_FOUND","Order not found.",404);return ok(order)}catch(error){return handleError(error)}}
