import {
	type LoaderFunctionArgs,
	json,
	type ActionFunctionArgs,
} from '@remix-run/node'
import OpenAI from 'openai'
import { prisma } from '#app/utils/db.server.ts'
// import { Textarea } from '#app/components/ui/textarea.tsx'
// import { Button } from '#app/components/ui/button.tsx'

// type LoaderData = {
// 	assistantRole: string
// 	rubric: string
// 	requirements: string
// 	id: string
// 	studentResponse: string
// }

// interface SummaryData {
// 	summary: string
// }

export interface ReturnedDataProps {
	message?: string
	answer: string
	error?: string
	chatHistory: OpenAI.Chat.Completions.ChatCompletionMessage[]
}

export interface ChatHistoryProps
	extends OpenAI.Chat.Completions.ChatCompletionMessage {
	error?: boolean
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const feedbackId = params?.id
	const myFeedback = await prisma.feedback.findUnique({
		where: { id: feedbackId },
	})
	return json({
		assistantRole: myFeedback?.assistantRole,
		rubric: myFeedback?.rubric,
		requirements: myFeedback?.requirements,
		id: myFeedback?.id,
		studentResponse: myFeedback?.studentResponse,
	})
}

/**
 * API call executed server side
 */
export async function action({
	request,
}: ActionFunctionArgs): Promise<ReturnedDataProps> {
	const body = await request.formData()
	const message = body.get('message') as string
	const chatHistory = JSON.parse(body.get('chat-history') as string) || []

	const feedback = await prisma.feedback.findUnique({
		where: { id: body.get('contextId') as string },
	})
	if (!feedback) {
		return {
			answer: 'No context found. Please go back and set the context.',
			// @ts-ignore
			chatHistory,
		}
	}
	// take the keys of the context object and map them to an array of objects
	// with a role of "system" and the content of the value
	const myContext = Object.keys(feedback).map(key => {
		if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
			return null
		} else {
			return {
				role: 'system',
				content: feedback[key as keyof typeof feedback] as string,
			}
		}
	})
	console.log('myContext: ', myContext)

	// store your key in .env
	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})

	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				...myContext,
				// @ts-ignore
				...chatHistory,
				{
					role: 'user',
					content: message,
				},
			],
		})

		const answer = chat.choices[0].message.content

		return {
			message: body.get('message') as string,
			answer: answer as string,
			//@ts-ignore
			chatHistory,
		}
	} catch (error: any) {
		return {
			message: body.get('message') as string,
			answer: '',
			error: error.message || 'Something went wrong! Please try again.',
			// @ts-ignore
			chatHistory,
		}
	}
}

// export default function IndexPage() {
//   const minTextareaRows = 1;
//   const maxTextareaRows = 3;
//   const loaderData: LoaderData = useLoaderData();
//   const data = useActionData<typeof action>();
//   const inputRef = useRef<HTMLTextAreaElement>(null);
//   const formRef = useRef<HTMLFormElement>(null);
//   const chatContainerRef = useRef<HTMLDivElement>(null);
//   const navigation = useNavigation();
//   const submit = useSubmit();
//   const summaryFetcher = useFetcher<SummaryData>();
//   const [chatHistory, setChatHistory] = useState<ChatHistoryProps[]>([]);
//   const [summary, setSummary] = useState();
//   console.log("loader data: ", loaderData);
//   console.log(summaryFetcher);

//   const location = useLocation();
//   const navigate = useNavigate();
//   const isSubmitting = navigation.state === "submitting";

//   /**
//    * Handles the change event of a textarea element and adjusts its height based on the content.
//    * Note: Using the ref to alter the rows rather than state since it's more performant / faster.
//    * @param event - The change event of the textarea element.
//    */
//   const handleTextareaChange = (
//     event: React.ChangeEvent<HTMLTextAreaElement>
//   ) => {
//     if (!inputRef.current) {
//       return;
//     }

//     // reset required for when the user pressed backspace (otherwise it would stay at max rows)
//     inputRef.current.rows = minTextareaRows;

//     const lineHeight = parseInt(
//       window.getComputedStyle(inputRef.current).lineHeight
//     );
//     const paddingTop = parseInt(
//       window.getComputedStyle(inputRef.current).paddingTop
//     );
//     const paddingBottom = parseInt(
//       window.getComputedStyle(inputRef.current).paddingBottom
//     );
//     const scrollHeight =
//       inputRef.current.scrollHeight - paddingTop - paddingBottom;
//     const currentRows = Math.floor(scrollHeight / lineHeight);
//     console.log("what is happening");

//     if (currentRows >= maxTextareaRows) {
//       inputRef.current.rows = maxTextareaRows;
//       inputRef.current.scrollTop = event.target.scrollHeight;
//     } else {
//       inputRef.current.rows = currentRows;
//     }
//   };

//   /**
//    * Adds a new message to the chat history
//    * @param data The message to add
//    */
//   const pushChatHistory = useCallback(
//     (data: ChatHistoryProps) => {
//       setChatHistory((prevState) => [...prevState, data]);
//     },
//     [setChatHistory]
//   );

//   /**
//    * Saves the user's message to the chat history
//    * @param content The user's message
//    */
//   const saveUserMessage = (content: string) => {
//     pushChatHistory({
//       content,
//       role: "user",
//     });
//   };

//   /**
//    * Ensure the user message is added to the chat on submit (button press)
//    * @param event Event from the form
//    */
//   const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     const formData = new FormData(event.target as HTMLFormElement);
//     const message = formData.get("message");

//     saveUserMessage(message as string);
//   };

//   /**
//    * Submits the form when the user pressed enter but not shift + enter
//    * Also saves a mesasge to the the chat history
//    *
//    * @param event The keydown event
//    */
//   const submitFormOnEnter = useCallback(
//     (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
//       const value = (event.target as HTMLTextAreaElement).value;

//       if (event.key === "Enter" && !event.shiftKey && value.trim().length > 2) {
//         saveUserMessage(value);
//         submit(formRef.current, { replace: true });
//       }
//     },
//     [submit, formRef, saveUserMessage]
//   );

//   /**
//    * Scrolls to the bottom of the chat container
//    * TODO: Conisder reduced motion
//    * @param animationDuration The duration of the animation in milliseconds
//    */
//   const scrollToBottom = useCallback((animationDuration: number = 300) => {
//     const body = document.body;
//     const html = document.documentElement;
//     const startTime = performance.now();

//     const step = (currentTime: number) => {
//       const targetScrollTop = Math.max(
//         body.scrollHeight,
//         body.offsetHeight,
//         html.clientHeight,
//         html.scrollHeight,
//         html.offsetHeight
//       );
//       const progress = (currentTime - startTime) / animationDuration;

//       window.scrollTo({ top: targetScrollTop });

//       if (progress < 1) {
//         window.requestAnimationFrame(step);
//       }
//     };

//     window.requestAnimationFrame(step);
//   }, []);

//   /**
//    * Sets the chat history when the page is loaded or the history is traversed (back / forward)
//    */
//   const setChat = useCallback(() => {
//     if (location.state?.chatHistory) {
//       setChatHistory(location.state.chatHistory);
//       scrollToBottom();
//     }
//   }, [location, setChatHistory, scrollToBottom]);

//   /**
//    * Summarizes the rubric and requirements
//    */

//   useEffect(() => {
//     const summary = async () => {
//       const summary = await summaryFetcher.submit(
//         {
//           rubric: loaderData.rubric,
//           requirements: loaderData.requirements,
//           contextId: loaderData.id,
//         },
//         { method: "post", action: "/resources/summarize" }
//       );
//     };
//     summary();
//   }, []);

//   /**
//    * Focuses the input element when the page is loaded and clears the
//    * input when the form is submitted
//    */
//   useEffect(() => {
//     if (!inputRef.current) {
//       return;
//     }

//     if (navigation.state === "submitting") {
//       inputRef.current.value = "";
//       inputRef.current.rows = 1;
//     } else {
//       inputRef.current.focus();
//     }
//   }, [navigation.state]);

//   /**
//    * Adds the API's response message to the chat history
//    * when the data comes back from the action method
//    */
//   useEffect(() => {
//     if (data?.error) {
//       pushChatHistory({
//         content: data.error as string,
//         role: "assistant",
//         error: true,
//       });

//       return;
//     }

//     if (data?.answer) {
//       const newAnswer = {
//         content: data.answer as string,
//         role: "assistant",
//       };

//       pushChatHistory(newAnswer as ChatHistoryProps);

//       // push location to history
//       navigate("/chat", {
//         state: {
//           ...location.state,
//           chatHistory: [...chatHistory, newAnswer],
//         },
//       });
//     }
//   }, [data, pushChatHistory, navigate]);

//   /**
//    * Clears the chat history when the page is loaded without any state
//    */
//   useEffect(() => {
//     if (!location.state) {
//       setChatHistory([]);
//       scrollToBottom();
//     }
//   }, [location, setChatHistory, scrollToBottom]);

//   /**
//    * Sets the chat history when the page is loaded or the history is traversed (back / forward)
//    */
//   useEffect(() => {
//     setChat();
//   }, [setChat]);

//   /**
//    * Scrolls to the bottom of the chat container when the chat history changes
//    */
//   useEffect(() => {
//     if (!chatContainerRef.current) {
//       return;
//     }

//     if (chatHistory.length) {
//       scrollToBottom();
//     }
//   }, [chatHistory, scrollToBottom]);

//   return (
//     <main className="container mx-auto rounded-lg h-full grid grid-rows-layout p-4 pb-0 sm:p-8 sm:pb-0 max-w-full sm:max-w-auto">
//       <div className="fixed top-0 right-0 ">
//         <div className="w-24 text-blue-600 hover:text-blue-700">
//           <Link to="/">Change Context</Link>
//         </div>
//         <div className="w-24 text-blue-600 hover:text-blue-700">
//           <form method="post" action="/logout">
//             <Button type="submit">Logout</Button>
//           </form>
//         </div>
//       </div>
//       <div>
//         <h2 className="text-2xl font-semibold">Summary</h2>
//         <p>{summaryFetcher.data?.summary}</p>
//       </div>
//       <div className="chat-container" ref={chatContainerRef}>
//         {chatHistory.length === 0 && (
//           <div className="intro grid place-items-center h-full text-center">
//             <div className="intro-content">
//               <h1 className="text-4xl font-semibold">Gippity Grader</h1>
//               <p className="mt-4">
//                 If you're unsure of the context, just ask ☺️
//               </p>
//             </div>
//           </div>
//         )}
//         {chatHistory.length > 0 && (
//           <div className="messages max-w-maxWidth mx-auto min-h-full grid place-content-end grid-cols-1 gap-4">
//             {chatHistory.map((chat, index) => (
//               <React.Fragment key={`message-${index}`}>
//                 <Message
//                   error={chat.error}
//                   content={chat.content}
//                   role={chat.role}
//                 />
//               </React.Fragment>
//             ))}
//             {isSubmitting && <Message thinking role="assistant" content="" />}
//           </div>
//         )}
//       </div>
//       <div className="form-container p-4 sm:p-8 backdrop-blur-md sticky bottom-0">
//         <Form
//           aria-disabled={isSubmitting}
//           method="post"
//           ref={formRef}
//           onSubmit={handleFormSubmit}
//           replace
//           className="max-w-[500px] mx-auto"
//         >
//           <div className="input-wrap relative flex items-center">
//             <label
//               htmlFor="message"
//               className="absolute left[-9999px] w-px h-px overflow-hidden"
//             >
//               Chat with Gippity Grader here. Paste in your essay or ask a
//               question about the rubric or a previous response.
//             </label>
//             <Textarea
//               id="message"
//               aria-disabled={isSubmitting}
//               ref={inputRef}
//               className="auto-growing-input m-0 appearance-none text-slate-900 placeholder:text-slate-900/25 resize-none text-sm md:text-base py-3 pl-5 pr-14  w-full block leading-6 "
//               placeholder="Chat with Gippity Grader here. Paste in your essay or ask a question about the rubric or a previous response."
//               name="message"
//               onChange={handleTextareaChange}
//               required
//               rows={1}
//               onKeyDown={submitFormOnEnter}
//               minLength={2}
//               disabled={isSubmitting}
//               defaultValue={loaderData.studentResponse}
//             />
//             <input
//               type="hidden"
//               value={JSON.stringify(chatHistory)}
//               name="chat-history"
//             />
//             <button
//               aria-label="Submit"
//               aria-disabled={isSubmitting}
//               className="absolute right-0 flex-shrink-0 items-center appearance-none text-black h-[50px] w-[50px] border-none cursor-pointer shadow-none rounded-4xl grid place-items-center group transition-colors disabled:cursor-not-allowed focus:outline-dark-blue"
//               type="submit"
//               disabled={isSubmitting}
//             >
//               <SendIcon />
//             </button>
//           </div>
//         </Form>
//       </div>
//     </main>
//   );
// }

// export function ErrorBoundary({ error }: { error: Error }) {
//   return (
//     <main className="container mx-auto rounded-lg h-full grid grid-rows-layout p-4 pb-0 sm:p-8 sm:pb-0 max-w-full sm:max-w-auto">
//       <div className="chat-container">
//         <div className="intro grid place-items-center h-full text-center">
//           <div className="intro-content inline-block px-4 py-8 border border-error rounded-lg">
//             <h1 className="text-3xl font-semibold">
//               Oops, something went wrong!
//             </h1>
//             <p className="mt-4 text-error ">{error.message}</p>
//             <p className="mt-4">
//               <Link to="/">Back to chat</Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }
