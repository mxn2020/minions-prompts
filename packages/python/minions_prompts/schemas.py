"""
Minion Type definitions for the five prompt primitive types.
"""

from __future__ import annotations

from minions import MinionType, FieldDefinition, TypeRegistry

prompt_template_type = MinionType(
    id="minions-prompts/prompt-template",
    name="Prompt Template",
    slug="prompt-template",
    description="A reusable prompt with variable placeholders and version history.",
    icon="📝",
    schema=[
        FieldDefinition(
            name="content",
            type="textarea",
            label="Content",
            description="The prompt body. Use {{variable}} for placeholders.",
            required=True,
        ),
        FieldDefinition(
            name="description",
            type="string",
            label="Description",
        ),
        FieldDefinition(
            name="variables",
            type="tags",
            label="Variables",
        ),
        FieldDefinition(
            name="tags",
            type="tags",
            label="Tags",
        ),
    ],
    is_system=False,
)

prompt_version_type = MinionType(
    id="minions-prompts/prompt-version",
    name="Prompt Version",
    slug="prompt-version",
    description="A versioned snapshot of a prompt template.",
    icon="🔖",
    schema=[
        FieldDefinition(
            name="content",
            type="textarea",
            label="Content",
            required=True,
        ),
        FieldDefinition(
            name="description",
            type="string",
            label="Description",
        ),
        FieldDefinition(
            name="versionNumber",
            type="number",
            label="Version Number",
        ),
        FieldDefinition(
            name="changelog",
            type="textarea",
            label="Changelog",
        ),
        FieldDefinition(
            name="variables",
            type="tags",
            label="Variables",
        ),
        FieldDefinition(
            name="tags",
            type="tags",
            label="Tags",
        ),
    ],
    is_system=False,
)

prompt_variable_type = MinionType(
    id="minions-prompts/prompt-variable",
    name="Prompt Variable",
    slug="prompt-variable",
    description="A typed variable definition for use in prompt templates.",
    icon="🔣",
    schema=[
        FieldDefinition(
            name="variableType",
            type="select",
            label="Type",
            options=["string", "number", "boolean", "array", "object"],
            required=True,
            default_value="string",
        ),
        FieldDefinition(
            name="description",
            type="string",
            label="Description",
        ),
        FieldDefinition(
            name="defaultValue",
            type="string",
            label="Default Value",
        ),
        FieldDefinition(
            name="required",
            type="boolean",
            label="Required",
            default_value=False,
        ),
        FieldDefinition(
            name="example",
            type="string",
            label="Example",
        ),
    ],
    is_system=False,
)

prompt_test_type = MinionType(
    id="minions-prompts/prompt-test",
    name="Prompt Test",
    slug="prompt-test",
    description="A test case with input variables and expected behavior criteria.",
    icon="🧪",
    schema=[
        FieldDefinition(
            name="inputVariables",
            type="json",
            label="Input Variables",
            required=True,
            default_value={},
        ),
        FieldDefinition(
            name="expectedCriteria",
            type="textarea",
            label="Expected Criteria",
        ),
        FieldDefinition(
            name="scoringDimensions",
            type="tags",
            label="Scoring Dimensions",
        ),
    ],
    is_system=False,
)

prompt_result_type = MinionType(
    id="minions-prompts/prompt-result",
    name="Prompt Result",
    slug="prompt-result",
    description="The result of running a test case against a prompt version.",
    icon="📊",
    schema=[
        FieldDefinition(
            name="renderedPrompt",
            type="textarea",
            label="Rendered Prompt",
            required=True,
        ),
        FieldDefinition(
            name="output",
            type="textarea",
            label="Output",
        ),
        FieldDefinition(
            name="scores",
            type="json",
            label="Scores",
            required=True,
            default_value={},
        ),
        FieldDefinition(
            name="metadata",
            type="json",
            label="Metadata",
        ),
        FieldDefinition(
            name="passed",
            type="boolean",
            label="Passed",
            required=True,
            default_value=False,
        ),
    ],
    is_system=False,
)

prompt_types = [
    prompt_template_type,
    prompt_version_type,
    prompt_variable_type,
    prompt_test_type,
    prompt_result_type,
]


def register_prompt_types(registry: TypeRegistry | None = None) -> TypeRegistry:
    """Register all prompt Minion Types into a TypeRegistry.

    Args:
        registry: An existing TypeRegistry to register into. Creates a new one if None.

    Returns:
        The registry with all types registered.
    """
    reg = registry or TypeRegistry()
    for t in prompt_types:
        reg.register(t)
    return reg
