export enum GenerationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export const DEFAULT_PROMPT_TEMPLATE = `You are a professional fashion photographer and digital compositing artist.

Generate one photorealistic fashion product image by strictly combining the references below, without interpretation.

🔴 HARD CONSTRAINTS (NON-NEGOTIABLE)

FACE — Reference [1]

Reference [1] contains only the face

Apply the face exactly as-is to a REAL HUMAN model

Identity must be identical: skin tone, bone structure, eyes, nose, lips, jaw, hair

No beautification, no stylization, no modification

The model must be a real person with natural human skin and features, NOT a mannequin or dummy

POSE — Reference [2]

Match the pose exactly

Identical head angle, shoulders, arms, hands, torso, legs, stance

Treat as a fixed skeleton

CRITICAL: Reference [2] is ONLY for body position and pose. IGNORE any mannequin, dummy, or non-human appearance in [2].

Extract ONLY the body position, angles, and pose structure. DO NOT copy the mannequin's white surface, faceless appearance, or any non-human features.

The final model must be a REAL HUMAN with natural skin, not a mannequin.

BACKGROUND — Reference [3]

Use the background exactly as provided

Same colors, lighting, shadows, and composition

No changes

PRODUCT — Reference [4]

Model must wear/display the product from [4]

Preserve exact color, texture, fit, drape, and details

Product must look naturally worn

🔁 CONSISTENCY RULE

Using the same references [1], [2], [3] must always produce identical face, pose, and background.

Only the product may change when [4] changes.

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

Copy the mannequin appearance from the pose reference [2] - use ONLY the body position/pose

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

