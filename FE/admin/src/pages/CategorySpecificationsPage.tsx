import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { categoryApi } from '../api/category.api';
import { specificationApi } from '../api/specification.api';
import type {
  Category,
  CategorySpecification,
  SpecDataType,
  Specification,
  SpecificationGroup,
} from '../types';

const { Title, Text } = Typography;

const GROUP_COLORS: Record<string, string> = {
  'Thông tin cơ bản': 'blue',
  'Thông tin chung': 'blue',
  'Kích thước': 'cyan',
  'Kích thước và năng lực': 'cyan',
  'Điện năng': 'green',
  'Điện năng và hiệu suất': 'green',
  'Công nghệ': 'purple',
  'Tiện ích': 'purple',
  'Tiện ích - Tính năng': 'purple',
  'Thông số khác': 'orange',
};

const DATA_TYPE_LABELS: Record<SpecDataType, { label: string; color: string }> = {
  TEXT: { label: 'Văn bản (TEXT)', color: 'blue' },
  NUMBER: { label: 'Số (NUMBER)', color: 'green' },
  BOOLEAN: { label: 'Đúng/Sai (BOOLEAN)', color: 'purple' },
  OPTION: { label: 'Tùy chọn (OPTION)', color: 'orange' },
};

export default function CategorySpecificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategoryParam = searchParams.get('category');

  // Shared Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<SpecificationGroup[]>([]);
  const [allSpecs, setAllSpecs] = useState<Specification[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Tab 1: Category Specs state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryParam ? Number(initialCategoryParam) : null
  );
  const [categorySpecs, setCategorySpecs] = useState<CategorySpecification[]>([]);
  const [loadingCategorySpecs, setLoadingCategorySpecs] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editCategorySpecModalOpen, setEditCategorySpecModalOpen] = useState(false);
  const [editingCategorySpec, setEditingCategorySpec] = useState<CategorySpecification | null>(null);

  // Tab 2: Specs Library state
  const [specSearch, setSpecSearch] = useState('');
  const [specGroupFilter, setSpecGroupFilter] = useState<number | 'ALL'>('ALL');
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null);

  // Tab 3: Groups state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SpecificationGroup | null>(null);

  // Forms
  const [assignForm] = Form.useForm();
  const [editCategorySpecForm] = Form.useForm();
  const [specForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  // Load Initial Shared Data
  const loadSharedData = async () => {
    try {
      const [catsRes, groupsRes, specsRes] = await Promise.all([
        categoryApi.list(),
        specificationApi.getGroups(),
        specificationApi.getAll(),
      ]);
      const catsList = catsRes.data || [];
      setCategories(catsList);
      setGroups(groupsRes || []);
      setAllSpecs(specsRes || []);

      // Auto-select first category if none selected
      if (!selectedCategoryId && catsList.length > 0) {
        const firstId = catsList[0].ma_danh_muc;
        setSelectedCategoryId(firstId);
        setSearchParams({ category: String(firstId) });
      }
    } catch {
      message.error('Không thể tải dữ liệu danh mục và thông số');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadSharedData();
  }, []);

  // Load Specs for Selected Category
  const loadCategorySpecs = async (categoryId: number) => {
    setLoadingCategorySpecs(true);
    try {
      const data = await specificationApi.getByCategory(categoryId);
      setCategorySpecs(data);
    } catch {
      message.error('Không thể tải thông số của danh mục');
    } finally {
      setLoadingCategorySpecs(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryId) {
      loadCategorySpecs(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const handleCategoryChange = (catId: number) => {
    setSelectedCategoryId(catId);
    setSearchParams({ category: String(catId) });
  };

  // Available specs not yet assigned to the selected category
  const availableSpecsToAssign = useMemo(() => {
    const assignedIds = new Set(categorySpecs.map(s => s.ma_thong_so));
    return allSpecs.filter(s => !assignedIds.has(s.ma_thong_so));
  }, [allSpecs, categorySpecs]);

  // Handle Assign Spec To Category
  const handleAssignSubmit = async (values: any) => {
    if (!selectedCategoryId) return;
    try {
      if (values.mode === 'create_and_assign') {
        // Create new spec and assign
        await specificationApi.create({
          ma_nhom_thong_so: values.new_ma_nhom_thong_so,
          ten_thong_so: values.new_ten_thong_so,
          kieu_du_lieu: values.new_kieu_du_lieu,
          don_vi: values.new_don_vi,
          cho_phep_loc: values.new_cho_phep_loc,
          thu_tu_hien_thi: values.thu_tu_hien_thi || 0,
          ma_danh_muc: selectedCategoryId,
          bat_buoc: values.bat_buoc,
        });
        message.success('Đã tạo mới và gán thông số vào danh mục thành công');
        // Refresh all specs and category specs
        const [updatedSpecs] = await Promise.all([
          specificationApi.getAll(),
          loadCategorySpecs(selectedCategoryId),
        ]);
        setAllSpecs(updatedSpecs);
      } else {
        // Assign existing spec
        await specificationApi.addToCategory(selectedCategoryId, {
          ma_thong_so: values.ma_thong_so,
          bat_buoc: Boolean(values.bat_buoc),
          thu_tu_hien_thi: Number(values.thu_tu_hien_thi || 0),
        });
        message.success('Đã gán thông số vào danh mục thành công');
        await loadCategorySpecs(selectedCategoryId);
      }
      setAssignModalOpen(false);
      assignForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi gán thông số vào danh mục');
    }
  };

  // Toggle Bat Buoc directly from table
  const handleToggleBatBuoc = async (record: CategorySpecification, checked: boolean) => {
    if (!selectedCategoryId) return;
    try {
      await specificationApi.updateInCategory(selectedCategoryId, record.ma_thong_so, {
        bat_buoc: checked,
      });
      message.success(
        `Đã đổi '${record.ten_thong_so}' thành ${checked ? 'Bắt buộc nhập' : 'Tùy chọn'}`
      );
      setCategorySpecs(prev =>
        prev.map(s => (s.ma_thong_so === record.ma_thong_so ? { ...s, bat_buoc: checked } : s))
      );
    } catch {
      message.error('Lỗi khi cập nhật cấu hình thông số');
    }
  };

  // Edit Category Spec modal
  const handleOpenEditCategorySpec = (record: CategorySpecification) => {
    setEditingCategorySpec(record);
    editCategorySpecForm.setFieldsValue({
      bat_buoc: Boolean(record.bat_buoc),
      thu_tu_hien_thi: record.thu_tu_hien_thi || 0,
    });
    setEditCategorySpecModalOpen(true);
  };

  const handleEditCategorySpecSubmit = async (values: any) => {
    if (!selectedCategoryId || !editingCategorySpec) return;
    try {
      await specificationApi.updateInCategory(
        selectedCategoryId,
        editingCategorySpec.ma_thong_so,
        {
          bat_buoc: Boolean(values.bat_buoc),
          thu_tu_hien_thi: Number(values.thu_tu_hien_thi || 0),
        }
      );
      message.success('Cập nhật cấu hình thông số thành công');
      setEditCategorySpecModalOpen(false);
      await loadCategorySpecs(selectedCategoryId);
    } catch {
      message.error('Lỗi khi cập nhật cấu hình thông số');
    }
  };

  // Remove Spec From Category
  const handleRemoveCategorySpec = async (specId: number) => {
    if (!selectedCategoryId) return;
    try {
      await specificationApi.removeFromCategory(selectedCategoryId, specId);
      message.success('Đã xóa thông số khỏi danh mục');
      await loadCategorySpecs(selectedCategoryId);
    } catch {
      message.error('Lỗi khi xóa thông số khỏi danh mục');
    }
  };

  // Specs Library Filtered
  const filteredSpecs = useMemo(() => {
    return allSpecs.filter(s => {
      const matchSearch =
        !specSearch ||
        s.ten_thong_so.toLowerCase().includes(specSearch.toLowerCase()) ||
        s.ten_nhom_thong_so?.toLowerCase().includes(specSearch.toLowerCase());
      const matchGroup = specGroupFilter === 'ALL' || s.ma_nhom_thong_so === specGroupFilter;
      return matchSearch && matchGroup;
    });
  }, [allSpecs, specSearch, specGroupFilter]);

  // Spec Form Submit (Create/Update in library)
  const handleSpecSubmit = async (values: any) => {
    try {
      if (editingSpec) {
        await specificationApi.update(editingSpec.ma_thong_so, {
          ma_nhom_thong_so: values.ma_nhom_thong_so,
          ten_thong_so: values.ten_thong_so,
          kieu_du_lieu: values.kieu_du_lieu,
          don_vi: values.don_vi,
          cho_phep_loc: values.cho_phep_loc,
          thu_tu_hien_thi: values.thu_tu_hien_thi,
        });
        message.success('Cập nhật thông số thành công');
      } else {
        await specificationApi.create({
          ma_nhom_thong_so: values.ma_nhom_thong_so,
          ten_thong_so: values.ten_thong_so,
          kieu_du_lieu: values.kieu_du_lieu,
          don_vi: values.don_vi,
          cho_phep_loc: values.cho_phep_loc,
          thu_tu_hien_thi: values.thu_tu_hien_thi,
        });
        message.success('Tạo thông số kỹ thuật mới thành công');
      }
      setSpecModalOpen(false);
      setEditingSpec(null);
      specForm.resetFields();

      // Refresh specs
      const updated = await specificationApi.getAll();
      setAllSpecs(updated);
      if (selectedCategoryId) {
        await loadCategorySpecs(selectedCategoryId);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi lưu thông số');
    }
  };

  // Delete Spec from Library
  const handleDeleteSpec = async (specId: number) => {
    try {
      const res = await specificationApi.delete(specId);
      message.success(
        res.data?.softDeleted
          ? 'Thông số đã được ẩn do đang có sản phẩm sử dụng'
          : 'Đã xóa thông số kỹ thuật'
      );
      const updated = await specificationApi.getAll();
      setAllSpecs(updated);
      if (selectedCategoryId) {
        await loadCategorySpecs(selectedCategoryId);
      }
    } catch {
      message.error('Lỗi khi xóa thông số');
    }
  };

  // Group Form Submit
  const handleGroupSubmit = async (values: any) => {
    try {
      if (editingGroup) {
        await specificationApi.updateGroup(editingGroup.ma_nhom_thong_so, {
          ten_nhom_thong_so: values.ten_nhom_thong_so,
          thu_tu_hien_thi: values.thu_tu_hien_thi,
        });
        message.success('Cập nhật nhóm thông số thành công');
      } else {
        await specificationApi.createGroup({
          ten_nhom_thong_so: values.ten_nhom_thong_so,
          thu_tu_hien_thi: values.thu_tu_hien_thi || 0,
        });
        message.success('Tạo nhóm thông số thành công');
      }
      setGroupModalOpen(false);
      setEditingGroup(null);
      groupForm.resetFields();

      const updatedGroups = await specificationApi.getGroups();
      setGroups(updatedGroups);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi lưu nhóm thông số');
    }
  };

  if (loadingInitial) {
    return (
      <div className="loading-area" style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu cấu hình thông số..." />
      </div>
    );
  }

  const selectedCategoryObj = categories.find(c => c.ma_danh_muc === selectedCategoryId);

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <SettingOutlined style={{ marginRight: 8, color: '#176B52' }} />
          Quản lý Danh mục Thông số Kỹ thuật
        </Title>
        <Text type="secondary">
          Thiết lập các thông số kỹ thuật được phép sử dụng cho từng danh mục sản phẩm (Dynamic EAV Specifications).
        </Text>
      </div>

      <Tabs
        defaultActiveKey="1"
        type="card"
        items={[
          {
            key: '1',
            label: (
              <span>
                <FolderOpenOutlined /> Thông số theo Danh mục
              </span>
            ),
            children: (
              <div>
                {/* Category Selector Bar */}
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={12} lg={10}>
                      <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
                        <Text strong style={{ minWidth: 100 }}>
                          Chọn danh mục:
                        </Text>
                        <Select
                          showSearch
                          style={{ width: 280 }}
                          value={selectedCategoryId}
                          placeholder="Chọn danh mục để quản lý"
                          optionFilterProp="label"
                          onChange={handleCategoryChange}
                          options={categories.map(c => ({
                            value: c.ma_danh_muc,
                            label: c.ten_danh_muc,
                          }))}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12} lg={14} style={{ textAlign: 'right' }}>
                      <Space wrap>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => selectedCategoryId && loadCategorySpecs(selectedCategoryId)}
                        >
                          Làm mới
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          style={{ backgroundColor: '#176B52' }}
                          onClick={() => {
                            assignForm.resetFields();
                            assignForm.setFieldsValue({
                              mode: 'existing',
                              bat_buoc: false,
                              thu_tu_hien_thi: categorySpecs.length + 1,
                            });
                            setAssignModalOpen(true);
                          }}
                        >
                          Gán thông số cho danh mục này
                        </Button>
                      </Space>
                    </Col>
                  </Row>

                  {/* Summary Badges */}
                  {selectedCategoryObj && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                      <Space size="large" wrap>
                        <Text>
                          Danh mục: <strong style={{ color: '#176B52' }}>{selectedCategoryObj.ten_danh_muc}</strong>
                        </Text>
                        <Text>
                          Tổng số thông số: <strong>{categorySpecs.length}</strong>
                        </Text>
                        <Text>
                          Bắt buộc nhập:{' '}
                          <Tag color="red">
                            {categorySpecs.filter(s => s.bat_buoc).length} thông số
                          </Tag>
                        </Text>
                        <Text>
                          Tùy chọn:{' '}
                          <Tag color="blue">
                            {categorySpecs.filter(s => !s.bat_buoc).length} thông số
                          </Tag>
                        </Text>
                      </Space>
                    </div>
                  )}
                </Card>

                {/* Category Specs Table */}
                <Card title={`Danh sách thông số của [ ${selectedCategoryObj?.ten_danh_muc || 'Danh mục'} ]`}>
                  <Table
                    loading={loadingCategorySpecs}
                    dataSource={categorySpecs}
                    rowKey="ma_thong_so"
                    pagination={{ pageSize: 15 }}
                    columns={[
                      {
                        title: 'Tên thông số',
                        dataIndex: 'ten_thong_so',
                        render: (text: string) => <strong>{text}</strong>,
                      },
                      {
                        title: 'Nhóm thông số',
                        dataIndex: 'ten_nhom_thong_so',
                        render: (group: string) => (
                          <Tag color={GROUP_COLORS[group] || 'default'}>{group || 'Thông số khác'}</Tag>
                        ),
                      },
                      {
                        title: 'Kiểu dữ liệu',
                        dataIndex: 'kieu_du_lieu',
                        render: (type: SpecDataType) => {
                          const conf = DATA_TYPE_LABELS[type] || { label: type, color: 'default' };
                          return <Tag color={conf.color}>{conf.label}</Tag>;
                        },
                      },
                      {
                        title: 'Đơn vị đo',
                        dataIndex: 'don_vi',
                        render: (unit: string | null) =>
                          unit ? <Tag color="geekblue">{unit}</Tag> : <Text type="secondary">—</Text>,
                      },
                      {
                        title: 'Bắt buộc nhập',
                        dataIndex: 'bat_buoc',
                        render: (val: boolean, record) => (
                          <Tooltip title="Nhấp để bật/tắt yêu cầu bắt buộc">
                            <Switch
                              checked={Boolean(val)}
                              checkedChildren="Bắt buộc"
                              unCheckedChildren="Tùy chọn"
                              onChange={checked => handleToggleBatBuoc(record, checked)}
                            />
                          </Tooltip>
                        ),
                      },
                      {
                        title: 'Cho phép lọc',
                        dataIndex: 'cho_phep_loc',
                        render: (val: boolean) =>
                          val ? (
                            <Tag icon={<FilterOutlined />} color="cyan">
                              Có
                            </Tag>
                          ) : (
                            <Text type="secondary">Không</Text>
                          ),
                      },
                      {
                        title: 'Thứ tự',
                        dataIndex: 'thu_tu_hien_thi',
                        width: 90,
                        align: 'center',
                      },
                      {
                        title: 'Thao tác',
                        key: 'action',
                        width: 140,
                        render: (_, record) => (
                          <Space size="middle">
                            <Button
                              type="text"
                              icon={<EditOutlined style={{ color: '#1890ff' }} />}
                              onClick={() => handleOpenEditCategorySpec(record)}
                            />
                            <Popconfirm
                              title="Xóa thông số khỏi danh mục"
                              description={`Bạn có chắc muốn bỏ thông số "${record.ten_thong_so}" khỏi danh mục này?`}
                              okText="Xóa"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => handleRemoveCategorySpec(record.ma_thong_so)}
                            >
                              <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <SettingOutlined /> Thư viện Thông số kỹ thuật
              </span>
            ),
            children: (
              <Card>
                {/* Search & Actions */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }} justify="space-between">
                  <Col xs={24} md={16}>
                    <Space wrap>
                      <Input.Search
                        placeholder="Tìm tên thông số hoặc nhóm..."
                        allowClear
                        style={{ width: 260 }}
                        onSearch={val => setSpecSearch(val)}
                        onChange={e => setSpecSearch(e.target.value)}
                      />
                      <Select
                        style={{ width: 220 }}
                        value={specGroupFilter}
                        onChange={val => setSpecGroupFilter(val)}
                        options={[
                          { value: 'ALL', label: 'Tất cả các nhóm' },
                          ...groups.map(g => ({
                            value: g.ma_nhom_thong_so,
                            label: g.ten_nhom_thong_so,
                          })),
                        ]}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ backgroundColor: '#176B52' }}
                      onClick={() => {
                        setEditingSpec(null);
                        specForm.resetFields();
                        specForm.setFieldsValue({
                          kieu_du_lieu: 'TEXT',
                          cho_phep_loc: false,
                          thu_tu_hien_thi: 0,
                        });
                        setSpecModalOpen(true);
                      }}
                    >
                      Thêm thông số mới
                    </Button>
                  </Col>
                </Row>

                <Table
                  dataSource={filteredSpecs}
                  rowKey="ma_thong_so"
                  pagination={{ pageSize: 12 }}
                  columns={[
                    { title: 'Mã', dataIndex: 'ma_thong_so', width: 70 },
                    { title: 'Tên thông số', dataIndex: 'ten_thong_so', render: text => <strong>{text}</strong> },
                    {
                      title: 'Nhóm',
                      dataIndex: 'ten_nhom_thong_so',
                      render: text => <Tag color={GROUP_COLORS[text] || 'default'}>{text}</Tag>,
                    },
                    {
                      title: 'Kiểu dữ liệu',
                      dataIndex: 'kieu_du_lieu',
                      render: (type: SpecDataType) => {
                        const conf = DATA_TYPE_LABELS[type] || { label: type, color: 'default' };
                        return <Tag color={conf.color}>{conf.label}</Tag>;
                      },
                    },
                    {
                      title: 'Đơn vị',
                      dataIndex: 'don_vi',
                      render: text => (text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">—</Text>),
                    },
                    {
                      title: 'Lọc sản phẩm',
                      dataIndex: 'cho_phep_loc',
                      render: val =>
                        val ? <Tag color="cyan">Cho phép</Tag> : <Text type="secondary">Không</Text>,
                    },
                    {
                      title: 'Thứ tự',
                      dataIndex: 'thu_tu_hien_thi',
                      width: 80,
                      align: 'center',
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'trang_thai',
                      render: val =>
                        val ? <Tag color="success">Đang dùng</Tag> : <Tag color="error">Đã ẩn</Tag>,
                    },
                    {
                      title: 'Thao tác',
                      key: 'action',
                      width: 130,
                      render: (_, record) => (
                        <Space size="middle">
                          <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => {
                              setEditingSpec(record);
                              specForm.setFieldsValue(record);
                              setSpecModalOpen(true);
                            }}
                          />
                          <Popconfirm
                            title="Xóa / Ẩn thông số"
                            description="Nếu đã có sản phẩm sử dụng, thông số sẽ được chuyển thành ẩn. Bạn có chắc muốn tiếp tục?"
                            okText="Đồng ý"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDeleteSpec(record.ma_thong_so)}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: '3',
            label: (
              <span>
                <SettingOutlined /> Nhóm thông số
              </span>
            ),
            children: (
              <Card>
                <div style={{ textAlign: 'right', marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ backgroundColor: '#176B52' }}
                    onClick={() => {
                      setEditingGroup(null);
                      groupForm.resetFields();
                      groupForm.setFieldsValue({ thu_tu_hien_thi: groups.length + 1 });
                      setGroupModalOpen(true);
                    }}
                  >
                    Thêm nhóm mới
                  </Button>
                </div>

                <Table
                  dataSource={groups}
                  rowKey="ma_nhom_thong_so"
                  pagination={false}
                  columns={[
                    { title: 'Mã nhóm', dataIndex: 'ma_nhom_thong_so', width: 90 },
                    {
                      title: 'Tên nhóm thông số',
                      dataIndex: 'ten_nhom_thong_so',
                      render: text => (
                        <Tag color={GROUP_COLORS[text] || 'green'} style={{ fontSize: 13, padding: '4px 8px' }}>
                          <strong>{text}</strong>
                        </Tag>
                      ),
                    },
                    { title: 'Thứ tự hiển thị', dataIndex: 'thu_tu_hien_thi', width: 140, align: 'center' },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'trang_thai',
                      render: val => (val ? <Tag color="success">Hoạt động</Tag> : <Tag color="default">Tắt</Tag>),
                    },
                    {
                      title: 'Thao tác',
                      key: 'action',
                      width: 100,
                      render: (_, record) => (
                        <Button
                          type="text"
                          icon={<EditOutlined style={{ color: '#1890ff' }} />}
                          onClick={() => {
                            setEditingGroup(record);
                            groupForm.setFieldsValue(record);
                            setGroupModalOpen(true);
                          }}
                        />
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal 1: Assign Spec To Category */}
      <Modal
        title={`Gán thông số vào danh mục [ ${selectedCategoryObj?.ten_danh_muc} ]`}
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        destroyOnClose
        width={580}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
          initialValues={{ mode: 'existing', bat_buoc: false, thu_tu_hien_thi: 0 }}
        >
          <Form.Item name="mode" label="Nguồn thông số">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="existing">Chọn từ thư viện có sẵn</Radio.Button>
              <Radio.Button value="create_and_assign">Tạo mới thông số và gán ngay</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.mode !== curr.mode}>
            {({ getFieldValue }) => {
              const mode = getFieldValue('mode');
              if (mode === 'create_and_assign') {
                return (
                  <>
                    <Form.Item
                      name="new_ma_nhom_thong_so"
                      label="Nhóm thông số"
                      rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}
                    >
                      <Select
                        placeholder="Chọn nhóm thông số"
                        options={groups.map(g => ({
                          value: g.ma_nhom_thong_so,
                          label: g.ten_nhom_thong_so,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      name="new_ten_thong_so"
                      label="Tên thông số"
                      rules={[{ required: true, message: 'Nhập tên thông số' }]}
                    >
                      <Input placeholder="Ví dụ: Công suất làm lạnh, Tần số quét, Dung tích..." />
                    </Form.Item>

                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item name="new_kieu_du_lieu" label="Kiểu dữ liệu" initialValue="TEXT">
                          <Select
                            options={[
                              { value: 'TEXT', label: 'Văn bản (TEXT)' },
                              { value: 'NUMBER', label: 'Số (NUMBER)' },
                              { value: 'BOOLEAN', label: 'Đúng/Sai (BOOLEAN)' },
                              { value: 'OPTION', label: 'Tùy chọn (OPTION)' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="new_don_vi" label="Đơn vị đo (nếu có)">
                          <Input placeholder="Ví dụ: W, L, kg, inch, cm..." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="new_cho_phep_loc" valuePropName="checked" initialValue={false}>
                      <Switch /> <span style={{ marginLeft: 8 }}>Cho phép dùng để lọc sản phẩm</span>
                    </Form.Item>
                  </>
                );
              }

              return (
                <Form.Item
                  name="ma_thong_so"
                  label="Chọn thông số từ thư viện"
                  rules={[{ required: true, message: 'Vui lòng chọn thông số' }]}
                >
                  {availableSpecsToAssign.length === 0 ? (
                    <Empty
                      description="Tất cả thông số trong thư viện đã được gán cho danh mục này"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Select
                      showSearch
                      placeholder="Tìm kiếm và chọn thông số"
                      optionFilterProp="label"
                      options={availableSpecsToAssign.map(s => ({
                        value: s.ma_thong_so,
                        label: `${s.ten_thong_so} (${s.ten_nhom_thong_so || 'Khác'} - ${s.kieu_du_lieu}${
                          s.don_vi ? ` - ${s.don_vi}` : ''
                        })`,
                      }))}
                    />
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bat_buoc" valuePropName="checked" label="Bắt buộc nhập khi tạo sản phẩm">
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="thu_tu_hien_thi" label="Thứ tự hiển thị">
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Space>
              <Button onClick={() => setAssignModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#176B52' }}>
                Lưu và Gán
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal 2: Edit Spec Config In Category */}
      <Modal
        title={`Sửa cấu hình thông số: ${editingCategorySpec?.ten_thong_so}`}
        open={editCategorySpecModalOpen}
        onCancel={() => setEditCategorySpecModalOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form form={editCategorySpecForm} layout="vertical" onFinish={handleEditCategorySpecSubmit}>
          <Form.Item name="bat_buoc" valuePropName="checked" label="Bắt buộc nhập khi tạo sản phẩm">
            <Switch checkedChildren="Có" unCheckedChildren="Không" />
          </Form.Item>

          <Form.Item name="thu_tu_hien_thi" label="Thứ tự hiển thị">
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Space>
              <Button onClick={() => setEditCategorySpecModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#176B52' }}>
                Lưu thay đổi
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal 3: Create / Edit Spec in Library */}
      <Modal
        title={editingSpec ? 'Sửa thông số kỹ thuật' : 'Tạo thông số kỹ thuật mới'}
        open={specModalOpen}
        onCancel={() => setSpecModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form form={specForm} layout="vertical" onFinish={handleSpecSubmit}>
          <Form.Item
            name="ma_nhom_thong_so"
            label="Nhóm thông số"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}
          >
            <Select
              placeholder="Chọn nhóm thông số"
              options={groups.map(g => ({
                value: g.ma_nhom_thong_so,
                label: g.ten_nhom_thong_so,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="ten_thong_so"
            label="Tên thông số"
            rules={[{ required: true, message: 'Nhập tên thông số' }]}
          >
            <Input placeholder="Ví dụ: Công suất, Dung tích, Khối lượng..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="kieu_du_lieu" label="Kiểu dữ liệu" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'TEXT', label: 'Văn bản (TEXT)' },
                    { value: 'NUMBER', label: 'Số (NUMBER)' },
                    { value: 'BOOLEAN', label: 'Đúng/Sai (BOOLEAN)' },
                    { value: 'OPTION', label: 'Tùy chọn (OPTION)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="don_vi" label="Đơn vị đo (nếu có)">
                <Input placeholder="Ví dụ: W, L, kg, inch, cm..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="thu_tu_hien_thi" label="Thứ tự hiển thị">
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cho_phep_loc" valuePropName="checked" label="Cho phép lọc">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Space>
              <Button onClick={() => setSpecModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#176B52' }}>
                Lưu
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal 4: Create / Edit Group */}
      <Modal
        title={editingGroup ? 'Sửa nhóm thông số' : 'Tạo nhóm thông số mới'}
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form form={groupForm} layout="vertical" onFinish={handleGroupSubmit}>
          <Form.Item
            name="ten_nhom_thong_so"
            label="Tên nhóm thông số"
            rules={[{ required: true, message: 'Nhập tên nhóm thông số' }]}
          >
            <Input placeholder="Ví dụ: Thông số cơ bản, Kích thước..." />
          </Form.Item>

          <Form.Item name="thu_tu_hien_thi" label="Thứ tự hiển thị">
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Space>
              <Button onClick={() => setGroupModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#176B52' }}>
                Lưu
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
