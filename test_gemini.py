from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents="Say hello to Laxmi in one short sentence."
)

print(response.text)