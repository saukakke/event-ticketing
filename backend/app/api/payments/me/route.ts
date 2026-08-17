import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";
export async function GET(){try{const user=await getAuthUser();if(!user)return errorResponse("UNAUTHENTICATED","Sign in required.",401);const payments=await prisma.order.findMany({where:{userId:user.id,paymentReference:{not:null}},select:{id:true,status:true,totalKobo:true,currency:true,paymentReference:true,createdAt:true,updatedAt:true,event:{select:{id:true,title:true}}},orderBy:{createdAt:"desc"}});return ok(payments)}catch(error){return handleError(error)}}
