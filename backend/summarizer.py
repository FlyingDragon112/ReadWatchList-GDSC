from huggingface_hub import hf_hub_download, login
from huggingface_hub import login
import spacy
from collections import Counter
from llama_cpp import Llama

login("")
model_path = hf_hub_download(
    repo_id="tensorblock/phi-1_5-GGUF",
    filename="phi-1_5-Q4_K_M.gguf",
    local_dir="/content/models"
)

llm = Llama(
    model_path=model_path,
    n_ctx=2048,
    n_threads=4,
    verbose=False
)

# Load lightweight English model
nlp = spacy.load("en_core_web_sm")

def extract_key_sentences(text, max_sentences=10):
    doc = nlp(text)
    word_freq = Counter()

    # Count word frequencies ignoring stop words & punctuation
    for token in doc:
        if token.is_stop or token.is_punct or token.like_num:
            continue
        word_freq[token.lemma_.lower()] += 1

    # Score sentences
    sentence_scores = []
    for sent in doc.sents:
        score = sum(word_freq.get(token.lemma_.lower(), 0) for token in sent if not token.is_stop)
        sentence_scores.append((score, sent.text.strip()))

    # Pick top N
    ranked = sorted(sentence_scores, reverse=True)[:max_sentences]
    return [text for _, text in ranked]

def preprocess_and_summarize(text, word_limit=250):
    key_sentences = extract_key_sentences(text, max_sentences=10)
    filtered_text = " ".join(key_sentences)

    print(f"Reduced to {len(filtered_text.split())} words before summarizing.")

    # Use same LLM logic
    prompt = (
        "You are an assistant that summarizes key points from an article.\n"
        "Write a clear, crisp summary in **no more than 5 lines or 150 words**.\n"
        f"{filtered_text}\n\nSummary:"
    )

    output = llm(
        prompt,
        max_tokens=150,
        temperature=0.3,
        top_p=0.9,
        stop=["</s>", "Summary:"]
    )

    return output["choices"][0]["text"].strip()

def get_summary(long_text):
    summary = preprocess_and_summarize(long_text, word_limit=250)
    return summary 
