export enum GenerationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export const DEFAULT_PROMPT_TEMPLATE = `You are a professional fashion photographer and digital compositing artist.

Generate one photorealistic fashion product image by strictly combining the references below, without interpretation.

🔴 HARD CONSTRAINTS (NON-NEGOTIABLE)

BACKGROUND — Reference [1]

CRITICAL: Use the background from Reference [1] EXACTLY as provided

The background must be IDENTICAL: same colors, lighting, shadows, composition, and all visual elements

The generated image will have the SAME background as Reference [1]

Replace the entire background with Reference [1] - do not modify, alter, or change anything

The background from [1] must be used completely, not just as inspiration

DO NOT use background from any other reference - ONLY use background from [1]

POSE & FACE — Reference [2]

Reference [2] contains a real human model with both face and pose

CRITICAL: Reference [2] is the SOURCE for face identity and body pose. The generated image MUST use the EXACT face and EXACT pose from [2].

Do not recreate or regenerate the face. Reuse the same person from Reference [2].

Extract the face identity EXACTLY as-is: skin tone, bone structure, eyes, nose, lips, jaw, hair

Extract the body position and pose EXACTLY: head angle, shoulders, arms, hands, torso, legs, stance

The face and pose from [2] must be applied identically to the final image

Identity must be identical: skin tone, bone structure, eyes, nose, lips, jaw, hair

Pose must be identical: head angle, shoulders, arms, hands, torso, legs, stance

The generated image will have the SAME face and SAME pose as Reference [2]

No beautification, no stylization, no modification

Treat the pose as a fixed skeleton

The model must be a real person with natural human skin and features

DO NOT copy any clothing from Reference [2] - the model in [2] may be wearing clothes, but those must be completely ignored

DO NOT use face or pose from any other reference - ONLY use face and pose from [2]

CLOTH/PRODUCT — Reference [3]

CRITICAL: Reference [3] is ONLY for the clothing/garment itself. IGNORE any model, face, pose, or person in [3].

The cloth image [3] may show a model wearing the clothes, but you must IGNORE that model completely.

Extract ONLY the clothing/garment from [3]: the fabric, design, color, texture, style, and details

The model in the generated image must wear/display ONLY the cloth/garment from Reference [3]

Preserve exact color, texture, fit, drape, and details from [3]

The cloth must look naturally worn and properly fitted on the model from Reference [2]

DO NOT copy the face, pose, or body from Reference [3] - use ONLY the clothing/garment

DO NOT use any clothing from Reference [2] - only use the cloth from [3]

The face and pose in [3] must be completely ignored - use face and pose ONLY from [2]

The background in [3] must be completely ignored - use background ONLY from [1]

🔁 CONSISTENCY RULE

Using the same references [1] and [2] must always produce identical background, face, and pose.

Only the cloth/product may change when [3] changes.

🎨 STYLE

Photorealistic fashion photography

Studio lighting

Natural skin texture

Sharp product focus

Magazine-quality realism

Product is the visual hero

🚫 DO NOT

Add text, logos, watermarks, props, or accessories

Alter face, pose, background, or product

Apply beauty retouching or artistic effects

Create a mannequin, dummy, or non-human model (the model must be a real human person)

Copy any clothing from Reference [2] - ignore all garments in [2]

Modify or change the background from Reference [1] - use it exactly as provided

Use any clothing other than the cloth from Reference [3]

Copy the face, pose, or model from Reference [3] - [3] is ONLY for the clothing/garment

Use face or pose from Reference [3] - face and pose come ONLY from [2]

Use background from Reference [3] - background comes ONLY from [1]

✅ OUTPUT

One clean, ultra-realistic product image suitable for e-commerce catalogs.`;

export const ERROR_MESSAGES = {
  MISSING_INDUSTRY: 'Industry not found',
  MISSING_CATEGORY: 'Category not found',
  MISSING_PRODUCT_TYPE: 'Product type not found',
  MISSING_PRODUCT_POSE: 'Product pose not found',
  MISSING_PRODUCT_THEME: 'Product theme not found',
  MISSING_PRODUCT_BACKGROUND: 'Product background not found',
  MISSING_AI_FACE: 'AI face not found',
  MISSING_REFERENCE_IMAGE: 'Reference image not available in storage',
  INVALID_PRODUCT_IMAGE: 'Invalid product image format or size',
  GEMINI_API_ERROR: 'Failed to generate image. Please try again.',
  GEMINI_RATE_LIMIT: 'Rate limit exceeded. Please try again in a moment.',
  STORAGE_ERROR: 'Failed to store generated image',
} as const;
