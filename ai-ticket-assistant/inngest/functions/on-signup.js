import { inngest } from "../client.js";
import  User  from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(

    { id: "on-user-signup", retries: 3 },
    { event: "user/signup" },
    async ({ event, step }) => {
        try {
            const { email } = event.data;
            const user = await step.run("get-user-email", async () => {
                const userObject = await User.findOne({ email })
                if (!userObject) {
                    throw new NonRetriableError("user no longer exists in our database")
                }
                return userObject;
            })
             

            //pipelines
            await step.run("send-welcome-email", async () => {
                const subject = `Welcome to the app`
                const message = `Hi,
                \n\n
                Thanks for signup up for our app. We are excited to have you on board!
                `
                await sendMail(user.email, subject, message)
            })
            return { success: true }

        }
        catch (error) {
            console.error("Failed to process user signup", error.message);
            return {
                success: false
            }
        }
    }
)