import { revalidatePath } from "next/cache";

export function revalidateQuizConsumers() {
    revalidatePath("/", "layout");
}
