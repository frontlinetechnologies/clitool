// Mock Anthropic SDK before any imports
const mockAnthropic = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return mockAnthropic;
});

describe('Anthropic Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockAnthropic.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null when API key is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { initializeClient, resetClient } = await import('../../../src/ai/anthropic-client');
    resetClient();
    const client = initializeClient();
    expect(client).toBeNull();
    expect(mockAnthropic).not.toHaveBeenCalled();
  });

  it('should initialize client when API key is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const mockClient = {
      messages: {
        create: jest.fn(),
      },
    };

    // Set up mock implementation
    mockAnthropic.mockImplementation(() => mockClient as any);

    const { initializeClient, resetClient } = await import('../../../src/ai/anthropic-client');
    resetClient();

    const client = initializeClient();
    expect(client).toBeDefined();
    expect(client).toBe(mockClient);
    expect(mockAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-test-key' });
  });

  it('should throw AIError on invalid API key format', async () => {
    process.env.ANTHROPIC_API_KEY = 'invalid-key';

    const { initializeClient, resetClient } = await import('../../../src/ai/anthropic-client');
    const { AIError, AIErrorType } = await import('../../../src/ai/errors');
    resetClient();

    expect(() => initializeClient()).toThrow(AIError);
    try {
      initializeClient();
    } catch (error) {
      expect(error).toBeInstanceOf(AIError);
      expect((error as any).type).toBe(AIErrorType.INVALID_KEY_FORMAT);
    }
  });

  it('should throw AIError on initialization error', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

    // Set up mock to throw error
    mockAnthropic.mockImplementation(() => {
      throw new Error('Initialization failed');
    });

    const { initializeClient, resetClient } = await import('../../../src/ai/anthropic-client');
    const { AIError } = await import('../../../src/ai/errors');
    resetClient();

    expect(() => initializeClient()).toThrow(AIError);
    expect(mockAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-test-key' });
  });

  it('should analyze page and return description', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const mockResponse = {
      content: [
        {
          type: 'text' as const,
          text: 'This is a test page description.',
        },
      ],
    };

    const mockClient = {
      messages: {
        create: jest.fn().mockResolvedValue(mockResponse),
      },
    };
    
    // Set up mock implementation
    mockAnthropic.mockImplementation(() => mockClient as any);
    
    const { analyzePage, resetClient } = await import('../../../src/ai/anthropic-client');
    resetClient();

    const description = await analyzePage('https://example.com', 'Test Page', '<html>content</html>');

    expect(description).toBe('This is a test page description.');
    expect(mockClient.messages.create).toHaveBeenCalled();
    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
          }),
        ]),
      }),
    );
  });

  it('should throw AIError when API call fails', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const mockClient = {
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API error')),
      },
    };

    // Set up mock implementation
    mockAnthropic.mockImplementation(() => mockClient as any);

    const { analyzePage, resetClient } = await import('../../../src/ai/anthropic-client');
    const { AIError } = await import('../../../src/ai/errors');
    resetClient();

    await expect(analyzePage('https://example.com')).rejects.toThrow(AIError);
    expect(mockClient.messages.create).toHaveBeenCalled();
  });

  it('should return null when client is not initialized', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { analyzePage, resetClient } = await import('../../../src/ai/anthropic-client');
    resetClient();
    const description = await analyzePage('https://example.com');
    expect(description).toBeNull();
    expect(mockAnthropic).not.toHaveBeenCalled();
  });

  it('should handle non-text response content', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const mockResponse = {
      content: [
        {
          type: 'image' as const,
          source: { type: 'base64', media_type: 'image/png', data: 'data' },
        },
      ],
    };

    const mockClient = {
      messages: {
        create: jest.fn().mockResolvedValue(mockResponse),
      },
    };

    // Set up mock implementation
    mockAnthropic.mockImplementation(() => mockClient as any);

    const { analyzePage, resetClient } = await import('../../../src/ai/anthropic-client');
    resetClient();

    const description = await analyzePage('https://example.com');

    expect(description).toBeNull();
    expect(mockClient.messages.create).toHaveBeenCalled();
  });
});
